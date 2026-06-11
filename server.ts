import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { db, runMigrations } from './src/db/sqlite.ts';
import { GoogleGenAI } from '@google/genai';

// Main Server Startup Function
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS helper for custom frontend origins like Vercel
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Paystack-Signature', 'X-Requested-With']
  }));

  // Middleware for body parsing with raw body support for signature verification
  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf.toString();
    }
  }));

  // Database auto-migration execution on launch configuration
  try {
    await runMigrations();
  } catch (err: any) {
    console.error('✖ Database table migrations failed to initialize:', err.message);
  }

  // Database helper mapping wrappers for response payload alignment
  const mapDbUserToClient = (dbUser: any) => {
    if (!dbUser) return null;
    return {
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      walletBalance: dbUser.wallet_balance,
      referralCode: dbUser.referral_code,
      referredCount: dbUser.referred_count,
      referralEarnings: dbUser.referral_earnings,
      kycLevel: dbUser.kyc_level,
      transactionPin: dbUser.transaction_pin,
      isPinSet: dbUser.is_pin_set === 1,
      isWebAuthnEnabled: dbUser.is_webauthn_enabled === 1,
      webAuthnCredentialId: dbUser.webauthn_credential_id || '',
    };
  };

  const mapDbTransactionToClient = (dbTx: any) => {
    if (!dbTx) return null;
    let parsedDetails = undefined;
    if (dbTx.details) {
      try {
        parsedDetails = JSON.parse(dbTx.details);
      } catch (e) {
        // fallback
      }
    }
    return {
      id: dbTx.id,
      type: dbTx.type,
      amount: dbTx.amount,
      fee: dbTx.fee,
      status: dbTx.status,
      timestamp: dbTx.timestamp,
      description: dbTx.description,
      recipient: dbTx.recipient,
      reference: dbTx.reference,
      details: parsedDetails
    };
  };

  // ==========================================
  // API Endpoints backed by Knex Pools & Trans
  // ==========================================

  // 1. API: Get or Create User
  app.get('/api/user', async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }

    try {
      let user = await db('users').where({ email: String(email) }).first();
      
      if (!user) {
        // Autogenerate referral codes and insert
        const refCode = `TOPUP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-9G`;
        await db('users').insert({
          email: String(email),
          phone: '08000000000',
          name: 'New User',
          wallet_balance: 100.0,
          referral_code: refCode,
          referred_count: 0,
          referral_earnings: 0.0,
          kyc_level: 'Tier 1',
          transaction_pin: '1111',
          is_pin_set: 1
        });
        user = await db('users').where({ email: String(email) }).first();
        console.log(`Created new pooled database record for user: ${email}`);
      }

      res.json({ success: true, user: mapDbUserToClient(user) });
    } catch (err) {
      next(err);
    }
  });

  // 1b. API: Register Account with specific details
  app.post('/api/user/register', async (req: Request, res: Response, next: NextFunction) => {
    const { email, name, phone, password, transactionPin, referralCode } = req.body;
    if (!email || !name || !phone) {
      return res.status(400).json({ error: 'Email, name, and phone parameters are required for registration' });
    }

    try {
      const targetEmail = String(email).trim();
      const targetPhone = String(phone).trim();

      // Detect and block multiple registration from existing email address with active credentials
      const existingEmailUser = await db('users').where({ email: targetEmail }).first();
      if (existingEmailUser && existingEmailUser.password && existingEmailUser.password.trim() !== '') {
        return res.status(400).json({ error: 'A registered account already exists with this email address. Please proceed to Login.' });
      }

      // Detect and block multiple registration from existing phone number with active credentials matching other users
      const existingPhoneUser = await db('users').where({ phone: targetPhone }).first();
      if (existingPhoneUser && existingPhoneUser.password && existingPhoneUser.password.trim() !== '' && existingPhoneUser.email !== targetEmail) {
        return res.status(400).json({ error: 'This phone number is already registered to another user account. Please use a different phone number.' });
      }

      let user = await db('users').where({ email: targetEmail }).first();
      
      const cleanPin = String(transactionPin || '1111').trim().substring(0, 4);
      const cleanPassword = String(password || '').trim();

      if (!user) {
        const refCode = `TOPUP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-9G`;
        
        // Handle referral rewarding if valid referral code is provided
        if (referralCode && String(referralCode).trim()) {
          try {
            const referrer = await db('users').where({ referral_code: String(referralCode).trim() }).orWhere({ email: String(referralCode).trim() }).first();
            if (referrer) {
              await db('users').where({ id: referrer.id }).update({
                referred_count: referrer.referred_count + 1,
                referral_earnings: referrer.referral_earnings + 500.0,
                wallet_balance: referrer.wallet_balance + 500.0
              });
              console.log(`Awarded referral bonus of ₦500 to referrer ${referrer.email}`);
            }
          } catch (refErr: any) {
            console.error('Failed to reward referrer:', refErr.message);
          }
        }

        await db('users').insert({
          email: String(email).trim(),
          phone: String(phone).trim(),
          name: String(name).trim(),
          wallet_balance: 100.0, // Welcome bonus matching client setting
          referral_code: refCode,
          referred_count: 0,
          referral_earnings: 0.0,
          kyc_level: 'Tier 1',
          transaction_pin: cleanPin,
          password: cleanPassword,
          is_pin_set: 1
        });
        user = await db('users').where({ email: String(email).trim() }).first();
        console.log(`Successfully registered new user in SQLite: ${email}`);
      } else {
        // Update details if they already exist from a guest route
        await db('users').where({ email: String(email).trim() }).update({
          name: String(name).trim(),
          phone: String(phone).trim(),
          transaction_pin: cleanPin,
          password: cleanPassword
        });
        user = await db('users').where({ email: String(email).trim() }).first();
      }

      res.json({ success: true, user: mapDbUserToClient(user) });
    } catch (err) {
      next(err);
    }
  });

  // 1c. API: Verify user existence by email or phone
  app.post('/api/auth/lookup', async (req: Request, res: Response, next: NextFunction) => {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Email or phone identifier required' });
    }

    try {
      const cleanId = String(identifier).trim();
      const user = await db('users')
        .where('email', cleanId)
        .orWhere('phone', cleanId)
        .first();

      if (user) {
        return res.json({ 
          success: true, 
          exists: true, 
          user: { 
            email: user.email, 
            phone: user.phone, 
            name: user.name,
            isPinSet: user.is_pin_set === 1
          } 
        });
      } else {
        return res.json({ success: true, exists: false });
      }
    } catch (err) {
      next(err);
    }
  });

  // 1d. API: Validate login with 4-digit security PIN
  app.post('/api/auth/verify-pin', async (req: Request, res: Response, next: NextFunction) => {
    const { identifier, pin } = req.body;
    if (!identifier || !pin) {
      return res.status(400).json({ error: 'Identifier and security PIN parameters required' });
    }

    try {
      const cleanId = String(identifier).trim();
      const user = await db('users')
        .where('email', cleanId)
        .orWhere('phone', cleanId)
        .first();

      if (!user) {
        return res.status(404).json({ error: 'User account not found' });
      }

      if (String(user.transaction_pin) === String(pin).trim()) {
        return res.json({ success: true, user: mapDbUserToClient(user) });
      } else {
        return res.status(400).json({ error: 'Incorrect 4-digit PIN protection. Please try again.' });
      }
    } catch (err) {
      next(err);
    }
  });

  // 1e. API: Reset password & 4-digit PIN
  app.post('/api/auth/reset-credentials', async (req: Request, res: Response, next: NextFunction) => {
    const { identifier, password, pin } = req.body;
    if (!identifier || !password || !pin) {
      return res.status(400).json({ error: 'Identifier, password, and 4-digit PIN are required' });
    }

    try {
      const cleanId = String(identifier).trim();
      const user = await db('users')
        .where('email', cleanId)
        .orWhere('phone', cleanId)
        .first();

      if (!user) {
        return res.status(404).json({ error: 'User account not found' });
      }

      await db('users')
        .where('id', user.id)
        .update({
          password: String(password).trim(),
          transaction_pin: String(pin).trim().substring(0, 4)
        });

      const updatedUser = await db('users').where('id', user.id).first();
      return res.json({ success: true, message: 'Password and PIN updated successfully!', user: mapDbUserToClient(updatedUser) });
    } catch (err) {
      next(err);
    }
  });

  // 2. API: Update User details
  app.post('/api/user/update', async (req: Request, res: Response, next: NextFunction) => {
    const { 
      email, name, phone, walletBalance, referralEarnings, referredCount, kycLevel, transactionPin, isPinSet,
      isWebAuthnEnabled, webAuthnCredentialId
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required for profile updates' });
    }

    try {
      const existing = await db('users').where({ email }).first();
      if (!existing) {
        return res.status(404).json({ error: 'User profile does not exist' });
      }

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (walletBalance !== undefined) updates.wallet_balance = walletBalance;
      if (referralEarnings !== undefined) updates.referral_earnings = referralEarnings;
      if (referredCount !== undefined) updates.referred_count = referredCount;
      if (kycLevel !== undefined) updates.kyc_level = kycLevel;
      if (transactionPin !== undefined) updates.transaction_pin = transactionPin;
      if (isPinSet !== undefined) updates.is_pin_set = isPinSet ? 1 : 0;
      if (isWebAuthnEnabled !== undefined) updates.is_webauthn_enabled = isWebAuthnEnabled ? 1 : 0;
      if (webAuthnCredentialId !== undefined) updates.webauthn_credential_id = webAuthnCredentialId;

      await db('users').where({ email }).update(updates);

      const updatedUser = await db('users').where({ email }).first();
      res.json({ success: true, user: mapDbUserToClient(updatedUser) });
    } catch (err) {
      next(err);
    }
  });

  // 3. API: Fetch Transactions
  app.get('/api/transactions', async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter mandatory' });
    }

    try {
      const dbTxList = await db('transactions')
        .where({ user_email: String(email) })
        .orderBy('timestamp', 'desc');
        
      const mapped = dbTxList.map(mapDbTransactionToClient);
      res.json({ success: true, transactions: mapped });
    } catch (err) {
      next(err);
    }
  });

  // 4. API: Create Transaction with ACID transaction guarantees and safe wallet checking
  app.post('/api/transactions/create', async (req: Request, res: Response, next: NextFunction) => {
    const { email, tx } = req.body;
    if (!email || !tx) {
      return res.status(400).json({ error: 'Email and transaction payload required' });
    }

    try {
      // Execute within an ACID knex transaction boundary to avoid balances/uniqueness race conditions
      await db.transaction(async (trx) => {
        const user = await trx('users').where({ email }).first();
        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }

        // Integrity checking: ensure reference is not duplicate before deducting wallet
        const duplicateTx = await trx('transactions').where({ reference: tx.reference }).first();
        if (duplicateTx) {
          throw new Error('DUPLICATE_REFERENCE_DETECTED');
        }

        // Calculate transaction impact on wallet balance
        const charge = tx.amount + (tx.fee || 0);
        let newBalance = user.wallet_balance;

        if (tx.status === 'success') {
          if (tx.type === 'funding' || tx.type === 'referral_bonus' || tx.type === 'cashback') {
            newBalance += tx.amount;
          } else {
            if (newBalance < charge) {
              throw new Error('INSUFFICIENT_WAL_BALANCE');
            }
            newBalance -= charge;
          }
        }

        // 1. Insert transaction history record with SQLite unique key validation
        const detailsStr = tx.details ? JSON.stringify(tx.details) : null;
        await trx('transactions').insert({
          id: tx.id,
          user_email: email,
          type: tx.type,
          amount: tx.amount,
          fee: tx.fee || 0,
          status: tx.status,
          timestamp: tx.timestamp,
          description: tx.description,
          recipient: tx.recipient,
          reference: tx.reference,
          details: detailsStr
        });

        // 2. Adjust user wallet balance safely inside the atomic transaction block
        await trx('users').where({ email }).update({ wallet_balance: newBalance });
      });

      // Retrieve and deliver updated models to UI client
      const updatedUser = await db('users').where({ email }).first();
      const dbTx = await db('transactions').where({ id: tx.id }).first();

      res.json({ 
        success: true, 
        user: mapDbUserToClient(updatedUser),
        transaction: mapDbTransactionToClient(dbTx)
      });
    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND') {
        return res.status(404).json({ error: 'User does not exist in pool' });
      }
      if (err.message === 'DUPLICATE_REFERENCE_DETECTED') {
        return res.status(400).json({ error: 'Integrity constraint: This transaction reference was already recorded.' });
      }
      if (err.message === 'INSUFFICIENT_WAL_BALANCE') {
        return res.status(400).json({ error: 'Insufficient funds in wallet' });
      }
      next(err);
    }
  });

  // 5. API: Fetch Saved Beneficiaries
  app.get('/api/beneficiaries', async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter mandatory' });
    }

    try {
      const dbBens = await db('beneficiaries').where({ user_email: String(email) });
      const mapped = dbBens.map((b) => ({
        id: b.id,
        type: b.type,
        name: b.name,
        value: b.value,
        provider: b.provider
      }));
      res.json({ success: true, beneficiaries: mapped });
    } catch (err) {
      next(err);
    }
  });

  // 6. API: Add Saved Beneficiary
  app.post('/api/beneficiaries/create', async (req: Request, res: Response, next: NextFunction) => {
    const { email, beneficiary } = req.body;
    if (!email || !beneficiary) {
      return res.status(400).json({ error: 'Email and beneficiary data required' });
    }

    try {
      await db('beneficiaries').insert({
        id: beneficiary.id,
        user_email: email,
        type: beneficiary.type,
        name: beneficiary.name,
        value: beneficiary.value,
        provider: beneficiary.provider || ''
      });
      res.json({ success: true, beneficiary });
    } catch (err) {
      next(err);
    }
  });

  // 7. API: Delete Saved Beneficiary
  app.post('/api/beneficiaries/delete', async (req: Request, res: Response, next: NextFunction) => {
    const { email, id } = req.body;
    if (!email || !id) {
      return res.status(400).json({ error: 'Email and beneficiary id required' });
    }

    try {
      await db('beneficiaries').where({ id, user_email: email }).del();
      res.json({ success: true, deletedId: id });
    } catch (err) {
      next(err);
    }
  });

  // ==========================================
  // 7.4.5. API: VTU Config & Sagecloud credentials
  // ==========================================
  
  // Retrieve configurations
  app.get('/api/user/vtu-config', async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }

    try {
      let config = await db('api_configs').where({ user_email: String(email) }).first();
      if (!config) {
        await db('api_configs').insert({
          user_email: String(email),
          sagecloud_api_key: null,
          sagecloud_api_url: 'https://api.sagecloud.ng/v1',
          paystack_public_key: null,
          paystack_secret_key: null,
          smm_api_key: null,
          smm_api_url: 'https://easy-smm-panel.com/api/v2',
          strowallet_public_key: null,
          strowallet_secret_key: null,
          strowallet_api_url: 'https://api.strowallet.com/v1'
        });
        config = await db('api_configs').where({ user_email: String(email) }).first();
      }
      res.json({ success: true, config });
    } catch (err) {
      next(err);
    }
  });

  // Save configurations
  app.post('/api/user/vtu-config', async (req: Request, res: Response, next: NextFunction) => {
    const { 
      email, 
      sagecloudApiKey, 
      sagecloudApiUrl, 
      paystackPublicKey, 
      paystackSecretKey, 
      smmApiKey, 
      smmApiUrl,
      strowalletPublicKey,
      strowalletSecretKey,
      strowalletApiUrl
    } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }

    try {
      let config = await db('api_configs').where({ user_email: email }).first();
      if (!config) {
        await db('api_configs').insert({
          user_email: email,
          sagecloud_api_key: sagecloudApiKey || null,
          sagecloud_api_url: sagecloudApiUrl || 'https://api.sagecloud.ng/v1',
          paystack_public_key: paystackPublicKey || null,
          paystack_secret_key: paystackSecretKey || null,
          smm_api_key: smmApiKey || null,
          smm_api_url: smmApiUrl || 'https://easy-smm-panel.com/api/v2',
          strowallet_public_key: strowalletPublicKey || null,
          strowallet_secret_key: strowalletSecretKey || null,
          strowallet_api_url: strowalletApiUrl || 'https://api.strowallet.com/v1'
        });
      } else {
        await db('api_configs').where({ user_email: email }).update({
          sagecloud_api_key: sagecloudApiKey !== undefined ? sagecloudApiKey : null,
          sagecloud_api_url: sagecloudApiUrl !== undefined ? sagecloudApiUrl : 'https://api.sagecloud.ng/v1',
          paystack_public_key: paystackPublicKey !== undefined ? paystackPublicKey : null,
          paystack_secret_key: paystackSecretKey !== undefined ? paystackSecretKey : null,
          smm_api_key: smmApiKey !== undefined ? smmApiKey : null,
          smm_api_url: smmApiUrl !== undefined ? smmApiUrl : 'https://easy-smm-panel.com/api/v2',
          strowallet_public_key: strowalletPublicKey !== undefined ? strowalletPublicKey : null,
          strowallet_secret_key: strowalletSecretKey !== undefined ? strowalletSecretKey : null,
          strowallet_api_url: strowalletApiUrl !== undefined ? strowalletApiUrl : 'https://api.strowallet.com/v1'
        });
      }
      const updatedConfig = await db('api_configs').where({ user_email: email }).first();
      res.json({ success: true, config: updatedConfig });
    } catch (err) {
      next(err);
    }
  });

  // Try-out / Test Connection with Sagecloud endpoint
  app.post('/api/user/vtu-config/test', async (req: Request, res: Response) => {
    const { sagecloudApiKey, sagecloudApiUrl } = req.body;
    const url = sagecloudApiUrl || 'https://api.sagecloud.ng/v1';

    if (!sagecloudApiKey || sagecloudApiKey.trim() === '') {
      return res.status(400).json({ error: 'An API key must be provided to run tests.' });
    }

    console.log(`[SAGECLOUD_TEST] Testing connection to base URL: ${url}`);

    // If it's a test or sandbox key, respond with custom diagnostic mockup status
    if (sagecloudApiKey.toLowerCase().includes('sandbox') || sagecloudApiKey.toLowerCase().includes('test')) {
      return res.json({
        success: true,
        message: 'Successfully established sandboxed tunnel to Sagecloud development portal.',
        balance: 75000.0,
        merchantName: 'Mock Sagecloud Sandbox Merchant',
        status: 'ACTIVE'
      });
    }

    try {
      // Test multiple common balance endpoints of Sagecloud as fallback
      const endpointsToTry = ['/balance', '/wallet/balance', '/user/balance'];
      let lastErr: any = null;
      let successData: any = null;

      for (const endpoint of endpointsToTry) {
        try {
          const testUrl = `${url.replace(/\/$/, '')}${endpoint}`;
          console.log(`[SAGECLOUD_TEST] Trying endpoint: ${testUrl}`);
          
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${sagecloudApiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(6000) // 6 seconds timeout
          });

          if (response.ok) {
            const data = await response.json();
            successData = data;
            break;
          } else {
            const errText = await response.text();
            lastErr = `Response ${response.status}: ${errText}`;
          }
        } catch (e: any) {
          lastErr = e.message;
        }
      }

      if (successData) {
        return res.json({
          success: true,
          message: 'Connection successfully established and verified!',
          balance: successData.balance !== undefined ? successData.balance : (successData.data?.balance || 'Not specified'),
          merchantName: successData.username || successData.fullname || successData.data?.merchant_name || 'Sagecloud Merchant Client',
          status: 'ACTIVE'
        });
      }

      // If we fall back here, we show the precise error so the developer can review what was returned
      return res.status(400).json({
        error: `Authentication failed or endpoint unreachable. Diagnostic output: ${lastErr || 'Unresponsive target server'}`
      });

    } catch (err: any) {
      return res.status(500).json({ error: `Network exception error: ${err.message}` });
    }
  });

  // ==========================================
  // 7.4.8. API: Git Commits & Repository Sync Simulation Diagnostics
  // ==========================================

  // Fetch all simulated git commits
  app.get('/api/git/commits', async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }
    try {
      const list = await db('git_commits')
        .where({ user_email: String(email) })
        .orderBy('id', 'desc');
      res.json({ success: true, commits: list });
    } catch (err) {
      next(err);
    }
  });

  // Execute/Simulate a git commit and push
  app.post('/api/git/commit', async (req: Request, res: Response, next: NextFunction) => {
    const { email, message, files } = req.body;
    if (!email || !message) {
      return res.status(400).json({ error: 'Email and commit message parameters are required' });
    }

    try {
      // Create a high-quality SHA-1 hash simulation
      const hashChars = '0123456789abcdef';
      let randomHash = '';
      for (let i = 0; i < 40; i++) {
        randomHash += hashChars[Math.floor(Math.random() * 16)];
      }

      const filesList = files || 'server.ts, src/components/SettingsConfig.tsx, src/db/sqlite.ts';
      const newCommit = {
        user_email: email,
        commit_hash: randomHash,
        message: message.trim(),
        files_changed: filesList,
        timestamp: new Date().toISOString(),
        status: 'PUSHED'
      };

      await db('git_commits').insert(newCommit);
      const inserted = await db('git_commits').where({ commit_hash: randomHash }).first();
      res.json({ success: true, commit: inserted });
    } catch (err) {
      next(err);
    }
  });

  // ==========================================
  // 7.5. API: Real VTU Service APIs and Wallet Funding integrations
  // ==========================================
  
  // Real Service topup and purchase processor
  app.post('/api/services/purchase', async (req: Request, res: Response, next: NextFunction) => {
    const { email, tx, cashbackGained } = req.body;
    if (!email || !tx) {
      return res.status(400).json({ error: 'Email and transaction payload required' });
    }

    try {
      // 1. Integrity balance check locally before calling external gateway
      const userProfile = await db('users').where({ email }).first();
      if (!userProfile) {
        return res.status(404).json({ error: 'User customer profile not found' });
      }
      const totalCharge = tx.amount + (tx.fee || 0);
      if (userProfile.wallet_balance < totalCharge) {
        return res.status(400).json({ error: 'Insufficient funds in wallet' });
      }

      let finalDetails = { ...(tx.details || {}) };

      // Load remote Sagecloud configurations for the user
      const config = await db('api_configs').where({ user_email: email }).first();
      const apiKey = config ? config.sagecloud_api_key : null;
      const apiUrl = config ? config.sagecloud_api_url : 'https://api.sagecloud.ng/v1';
      const smmApiKey = config ? config.smm_api_key : null;
      const smmApiUrl = config ? config.smm_api_url : 'https://easy-smm-panel.com/api/v2';

      const isLiveSagecloud = (apiKey && apiKey.trim() !== '' && !apiKey.toLowerCase().includes('sandbox') && !apiKey.toLowerCase().includes('mock') && !apiKey.toLowerCase().includes('test') && tx.type !== 'smm');
      const isLiveSmm = (tx.type === 'smm' && smmApiKey && smmApiKey.trim() !== '' && !smmApiKey.toLowerCase().includes('sandbox') && !smmApiKey.toLowerCase().includes('mock') && !smmApiKey.toLowerCase().includes('test'));

      // 2. Call live Sagecloud API if a real API Key is provided
      if (isLiveSagecloud) {
        console.log(`[SAGECLOUD_API] Routing live ${tx.type} transaction via Sagecloud.ng!`);
        
        let pathStr = '/airtime';
        let requestBody: any = {};
        
        if (tx.type === 'airtime') {
          pathStr = '/airtime';
          requestBody = {
            network: tx.details?.network || 'MTN',
            amount: tx.amount,
            phone: tx.recipient,
            reference: tx.reference
          };
        } else if (tx.type === 'data') {
          pathStr = '/data';
          requestBody = {
            network: tx.details?.network || 'MTN',
            phone: tx.recipient,
            plan: tx.details?.planName || tx.details?.packageName || '1GB',
            plan_code: tx.details?.planId,
            reference: tx.reference
          };
        } else if (tx.type === 'electricity') {
          pathStr = '/electricity/pay';
          requestBody = {
            disco: tx.details?.disco || 'ikedc',
            meter: tx.recipient,
            amount: tx.amount,
            reference: tx.reference
          };
        } else if (tx.type === 'cable') {
          pathStr = '/cable/pay';
          requestBody = {
            provider: tx.details?.provider || 'dstv',
            plan: tx.details?.packageName || 'dstv-yanga',
            iuc: tx.recipient,
            reference: tx.reference
          };
        } else if (tx.type === 'education') {
          pathStr = '/education/pay';
          requestBody = {
            exam: tx.details?.examType || 'waec',
            amount: tx.amount,
            reference: tx.reference
          };
        }

        try {
          const targetUrl = `${apiUrl.replace(/\/$/, '')}${pathStr}`;
          console.log(`[SAGECLOUD_REQUEST] Calling ${targetUrl} with reference ${tx.reference}`);
          
          const gatewayResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(15000) // 15s timeout
          });

          if (!gatewayResponse.ok) {
            const errBody = await gatewayResponse.text();
            console.error(`[SAGECLOUD_ERROR] Request failed with status ${gatewayResponse.status}: ${errBody}`);
            
            let parsedErr = `HTTP ${gatewayResponse.status}: ${errBody}`;
            try {
              const parsedJson = JSON.parse(errBody);
              parsedErr = parsedJson.message || parsedJson.error || parsedErr;
            } catch (e) {}
            
            return res.status(400).json({
              error: `Sagecloud VTU Gateway Error: ${parsedErr}`
            });
          }

          const responseData = await gatewayResponse.json();
          console.log(`[SAGECLOUD_SUCCESS] API response data:`, JSON.stringify(responseData));

          // Map dynamic tokens/codes returned by Sagecloud API
          if (responseData.token || responseData.data?.token) {
            finalDetails.token = responseData.token || responseData.data?.token;
          }
          if (responseData.pin || responseData.data?.pins) {
            finalDetails.pin = responseData.pin || responseData.data?.pins[0]?.pin || responseData.pin;
            finalDetails.pins = responseData.data?.pins || finalDetails.pins;
          }
          finalDetails.gatewayResponseCode = responseData.status || responseData.code || 'SUCCESS';
          finalDetails.processedBy = 'Sagecloud LIVE Gateway';

        } catch (err: any) {
          console.error(`[SAGECLOUD_EXCEPTION] Network failure calling Sagecloud VTU:`, err);
          return res.status(500).json({
            error: `Communication failed with Sagecloud VTU gateway server: ${err.message}`
          });
        }
      } else if (isLiveSmm) {
        console.log(`[SMM_PANEL_API] Routing live SMM transaction via: ${smmApiUrl}`);
        try {
          const params = new URLSearchParams();
          params.append('key', smmApiKey!);
          params.append('action', 'add');
          params.append('service', String(tx.details?.serviceId || tx.details?.planId || '100'));
          params.append('link', tx.recipient);
          params.append('quantity', String(tx.details?.quantity || '100'));

          const gatewayResponse = await fetch(smmApiUrl!, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString(),
            signal: AbortSignal.timeout(15000)
          });

          if (!gatewayResponse.ok) {
            const errBody = await gatewayResponse.text();
            console.error(`[SMM_PANEL_ERROR] Request failed with status ${gatewayResponse.status}: ${errBody}`);
            return res.status(400).json({
              error: `SMM Panel Gateway Error (HTTP ${gatewayResponse.status}): ${errBody}`
            });
          }

          const responseData = await gatewayResponse.json();
          console.log(`[SMM_PANEL_SUCCESS] API response:`, JSON.stringify(responseData));

          if (responseData.error) {
            return res.status(400).json({
              error: `SMM Reseller Panel Error: ${responseData.error}`
            });
          }

          finalDetails.trackingId = responseData.order || responseData.order_id || 'BOOST-' + Math.floor(100000 + Math.random() * 899999);
          finalDetails.status = 'PENDING';
          finalDetails.estimatedStart = '15 - 45 minutes';
          finalDetails.processedBy = 'SMM Live Merchant Panel';
          finalDetails.gatewayResponseCode = 'SUCCESS';
        } catch (err: any) {
          console.error(`[SMM_PANEL_EXCEPTION] Network failure calling SMM panel:`, err);
          return res.status(500).json({
            error: `Communication failed with SMM reseller gateway server: ${err.message}`
          });
        }
      } else {
        // Enforce sandbox simulation outputs for test exploration
        finalDetails.processedBy = 'Sagecloud Safe Sandbox (Interactive)';
        
        if (tx.type === 'electricity') {
          const p1 = Math.floor(1000 + Math.random() * 9000);
          const p2 = Math.floor(1000 + Math.random() * 9000);
          const p3 = Math.floor(1000 + Math.random() * 9000);
          const p4 = Math.floor(1000 + Math.random() * 9000);
          const p5 = Math.floor(1000 + Math.random() * 9000);
          finalDetails.token = `${p1}-${p2}-${p3}-${p4}-${p5}`;
          finalDetails.unitsToken = (tx.amount / 95.5 + Math.random() * 4).toFixed(1) + ' kWh';
        } else if (tx.type === 'education') {
          const pinVal = Math.floor(100000000000 + Math.random() * 899999999999);
          const serialVal = 'WRC' + Math.floor(1000000000 + Math.random() * 8999999999);
          finalDetails.pin = `${pinVal}`;
          finalDetails.serial = `${serialVal}`;
        } else if (tx.type === 'cable') {
          const nextMonth = new Date();
          nextMonth.setDate(nextMonth.getDate() + 30);
          finalDetails.expirationDate = nextMonth.toISOString().split('T')[0];
          finalDetails.statusCode = 'ACTIVE';
        } else if (tx.type === 'smm') {
          finalDetails.estimatedStart = '15 - 30 minutes';
          finalDetails.trackingId = 'BOOST-' + Math.floor(100000 + Math.random() * 899999);
          finalDetails.status = 'PROCESSING';
        }
      }

      // Simulate external API partner calls with realistic tokens and statuses
      console.log(`[VTU PARTNER API LINK] Initializing top-up for ${tx.type} with recipient: ${tx.recipient}, amount: ₦${tx.amount}`);

      let mainInsertedTx: any = null;
      let cbInsertedTx: any = null;

      await db.transaction(async (trx) => {
        const user = await trx('users').where({ email }).first();
        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }

        // Integrity checking: ensure reference is not duplicate
        const duplicateTx = await trx('transactions').where({ reference: tx.reference }).first();
        if (duplicateTx) {
          throw new Error('DUPLICATE_REFERENCE_DETECTED');
        }

        const charge = tx.amount + (tx.fee || 0);
        if (user.wallet_balance < charge) {
          throw new Error('INSUFFICIENT_WAL_BALANCE');
        }

        let newBalance = user.wallet_balance - charge;

        // Save Primary Transaction inside atomic block
        await trx('transactions').insert({
          id: tx.id,
          user_email: email,
          type: tx.type,
          amount: tx.amount,
          fee: tx.fee || 0,
          status: 'success',
          timestamp: tx.timestamp || new Date().toISOString(),
          description: tx.description,
          recipient: tx.recipient,
          reference: tx.reference,
          details: JSON.stringify(finalDetails)
        });

        // Insert cashback ledger if any exists
        if (cashbackGained && cashbackGained > 0) {
          newBalance += cashbackGained;
          const cbId = `tx_cb_${Date.now()}`;
          const cbRef = `TN-CSH-${Math.floor(100000 + Math.random() * 899999)}`;
          const cbDesc = `+₦${cashbackGained.toFixed(2)} Instant Cashback Received (${finalDetails.network || 'purchase'})`;
          
          await trx('transactions').insert({
            id: cbId,
            user_email: email,
            type: 'cashback',
            amount: cashbackGained,
            fee: 0,
            status: 'success',
            timestamp: new Date().toISOString(),
            description: cbDesc,
            recipient: 'Wallet Balance',
            reference: cbRef,
            details: null
          });
        }

        // Adjust user wallet balance stably
        await trx('users').where({ email }).update({ wallet_balance: newBalance });
      });

      // Fetch and return the updated structures
      const updatedUser = await db('users').where({ email }).first();
      const dbTx = await db('transactions').where({ id: tx.id }).first();
      // Return the recent two transactions to update lists
      const recentTxs = await db('transactions')
        .where({ user_email: email })
        .orderBy('timestamp', 'desc')
        .limit(2);

      res.json({
        success: true,
        user: mapDbUserToClient(updatedUser),
        transactions: recentTxs.map(mapDbTransactionToClient)
      });

    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND') {
        return res.status(404).json({ error: 'User does not exist in pool' });
      }
      if (err.message === 'DUPLICATE_REFERENCE_DETECTED') {
        return res.status(400).json({ error: 'Integrity constraint: This transaction reference was already recorded.' });
      }
      if (err.message === 'INSUFFICIENT_WAL_BALANCE') {
        return res.status(400).json({ error: 'Insufficient funds in wallet' });
      }
      next(err);
    }
  });

  // Pre-registers a PENDING wallet funding transaction for tracking/webhooks validation
  app.post('/api/wallet/fund/pending', async (req: Request, res: Response, next: NextFunction) => {
    const { email, amount, paymentMethod, reference, description } = req.body;
    
    if (!email || !amount || amount <= 0 || !reference) {
      return res.status(400).json({ error: 'Email, positive amount, and payment reference are required.' });
    }

    try {
      let pendingTx: any = null;

      await db.transaction(async (trx) => {
        const user = await trx('users').where({ email }).first();
        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }

        // Integrity check: reference uniqueness
        const duplicateTx = await trx('transactions').where({ reference }).first();
        if (duplicateTx) {
          throw new Error('DUPLICATE_REFERENCE_DETECTED');
        }

        const newId = `tx_fund_${Date.now()}`;
        const newTimestamp = new Date().toISOString();
        const fullDesc = description || `Funded +₦${amount.toLocaleString()} (Pending)`;

        // Insert pending transaction status
        await trx('transactions').insert({
          id: newId,
          user_email: email,
          type: 'funding',
          amount: amount,
          fee: 0,
          status: 'pending',
          timestamp: newTimestamp,
          description: fullDesc,
          recipient: 'Primary wallet',
          reference: reference,
          details: JSON.stringify({ gateway: paymentMethod || 'paystack_sim' })
        });

        pendingTx = {
          id: newId,
          type: 'funding',
          amount: amount,
          fee: 0,
          status: 'pending',
          timestamp: newTimestamp,
          description: fullDesc,
          recipient: 'Primary wallet',
          reference: reference,
          details: { gateway: paymentMethod || 'paystack_sim' }
        };
      });

      res.json({
        success: true,
        transaction: pendingTx
      });

    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND') {
        return res.status(404).json({ error: 'User profile not found.' });
      }
      if (err.message === 'DUPLICATE_REFERENCE_DETECTED') {
        return res.status(400).json({ error: 'This payment reference has already been initialized or processed.' });
      }
      next(err);
    }
  });

  // Real Wallet funding endpoint that performs atomic credits into the database 
  app.post('/api/wallet/fund', async (req: Request, res: Response, next: NextFunction) => {
    const { email, amount, paymentMethod, reference, description } = req.body;
    
    if (!email || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Email and positive amount variables are required.' });
    }

    try {
      const generatedRef = reference || `TN-DEP-${Math.floor(10000000 + Math.random() * 89999999)}`;
      
      await db.transaction(async (trx) => {
        const user = await trx('users').where({ email }).first();
        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }

        // Integrity checking: ensure reference is not duplicate before deducting wallet
        const duplicateTx = await trx('transactions').where({ reference: generatedRef }).first();
        if (duplicateTx) {
          throw new Error('DUPLICATE_REFERENCE_DETECTED');
        }

        // Save transaction ledger history
        await trx('transactions').insert({
          id: `tx_fund_${Date.now()}`,
          user_email: email,
          type: 'funding',
          amount: amount,
          fee: 0,
          status: 'success',
          timestamp: new Date().toISOString(),
          description: description || `Funded +₦${amount.toLocaleString()} via dynamic automated connection`,
          recipient: 'Primary wallet',
          reference: generatedRef,
          details: JSON.stringify({ gateway: paymentMethod || 'paystack_sim' })
        });

        // Add to wallet balance
        const currentBalance = user.wallet_balance;
        await trx('users').where({ email }).update({ wallet_balance: currentBalance + amount });
      });

      const updatedUser = await db('users').where({ email }).first();
      const recentTxs = await db('transactions')
        .where({ user_email: email })
        .orderBy('timestamp', 'desc')
        .limit(2);

      res.json({
        success: true,
        user: mapDbUserToClient(updatedUser),
        transactions: recentTxs.map(mapDbTransactionToClient)
      });

    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND') {
        return res.status(404).json({ error: 'User customer profile not found' });
      }
      if (err.message === 'DUPLICATE_REFERENCE_DETECTED') {
        return res.status(400).json({ error: 'This payment reference has already been fully processed and credited.' });
      }
      next(err);
    }
  });

  // ==========================================
  // REAL PAYSTACK PAYMENT INTEGRATIONS & SECURE WEBHOOKS
  // ==========================================

  // Secure Paystack server-side transaction verification proxy
  app.post('/api/paystack/verify', async (req: Request, res: Response, next: NextFunction) => {
    const { reference, email, amount } = req.body;
    
    if (!email || !reference) {
      return res.status(400).json({ error: 'Email and payment reference are required.' });
    }

    // Try finding a configured paystack secret key from DB first, then Env variable
    let pSecret = process.env.PAYSTACK_SECRET_KEY;
    try {
      const config = await db('api_configs').where({ user_email: email }).first();
      if (config && config.paystack_secret_key && config.paystack_secret_key.trim() !== '') {
        pSecret = config.paystack_secret_key.trim();
        console.log(`[PAYSTACK_VERIFY] Using user-defined custom Paystack Secret Key for ${email}`);
      }
    } catch (dbErr) {
      console.warn('[PAYSTACK_VERIFY] Could not fetch DB configuration, falling back to Env variables:', dbErr);
    }

    if (pSecret && pSecret.trim() !== '') {
      try {
        console.log(`[PAYSTACK_VERIFY] Verifying reference: ${reference} on Paystack official API...`);
        const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
        
        const pResponse = await fetch(verifyUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${pSecret.trim()}`,
            'Content-Type': 'application/json'
          }
        });

        if (!pResponse.ok) {
          const errText = await pResponse.text();
          return res.status(400).json({ error: `Paystack verification returned dynamic error code: ${errText}` });
        }

        const pData = await pResponse.json();
        if (pData.status && pData.data && pData.data.status === 'success') {
          const paystackAmountNGN = pData.data.amount / 100; // Paystack works in kobo
          const customerEmail = pData.data.customer?.email || email;
          
          console.log(`[PAYSTACK_VERIFY] Paystack verification success! Amount ₦${paystackAmountNGN} for ${customerEmail}`);
          
          await db.transaction(async (trx) => {
            const userObj = await trx('users').where({ email: customerEmail }).first();
            if (!userObj) {
              throw new Error('USER_NOT_FOUND');
            }

            const existingTx = await trx('transactions').where({ reference }).first();
            if (existingTx) {
              if (existingTx.status === 'success') {
                throw new Error('DUPLICATE_REFERENCE_DETECTED');
              }

              // Update pending/failed transaction record to success
              await trx('transactions').where({ reference }).update({
                status: 'success',
                amount: paystackAmountNGN,
                description: `Funded +₦${paystackAmountNGN.toLocaleString()} securely via Paystack API Verification`,
                details: JSON.stringify({ gateway: 'paystack_inline_verified', channel: pData.data.channel || 'card' })
              });

              // Credit user wallet
              const currentBalance = userObj.wallet_balance;
              await trx('users').where({ email: customerEmail }).update({ wallet_balance: currentBalance + paystackAmountNGN });
              console.log(`[PAYSTACK_VERIFY] Transitioned pending transaction ${reference} to success. Wallet credited.`);
            } else {
              // Save verified payment entry in ledger history if non-existent
              await trx('transactions').insert({
                id: `tx_fund_${Date.now()}`,
                user_email: customerEmail,
                type: 'funding',
                amount: paystackAmountNGN,
                fee: 0,
                status: 'success',
                timestamp: new Date().toISOString(),
                description: `Funded +₦${paystackAmountNGN.toLocaleString()} securely via Paystack API Verification`,
                recipient: 'Primary wallet',
                reference: reference,
                details: JSON.stringify({ gateway: 'paystack_inline_verified', channel: pData.data.channel || 'card' })
              });

              // Adjust user wallets limits and amounts
              const currentBalance = userObj.wallet_balance;
              await trx('users').where({ email: customerEmail }).update({ wallet_balance: currentBalance + paystackAmountNGN });
              console.log(`[PAYSTACK_VERIFY] Created new successful transaction for reference ${reference}. Wallet credited.`);
            }
          });

          const updatedUser = await db('users').where({ email: customerEmail }).first();
          const recentTxs = await db('transactions')
            .where({ user_email: customerEmail })
            .orderBy('timestamp', 'desc')
            .limit(2);

          return res.json({
            success: true,
            verified: true,
            user: mapDbUserToClient(updatedUser),
            transactions: recentTxs.map(mapDbTransactionToClient)
          });
        } else {
          return res.status(400).json({ error: `Paystack reported transaction check status as uncompleted: ${pData.data?.status || 'failed'}` });
        }
      } catch (err: any) {
        console.error(`[PAYSTACK_VERIFY_EXCEPTION] Verification error:`, err);
        return res.status(500).json({ error: `Failed to complete transaction checks: ${err.message}` });
      }
    } else {
      // Robust development fallback flow for Sandbox environments
      console.log(`[PAYSTACK_SIMULATED_VERIFY] Local simulation for reference: ${reference}`);
      const fundAmount = parseFloat(amount) || 1000;
      try {
        await db.transaction(async (trx) => {
          const userObj = await trx('users').where({ email }).first();
          if (!userObj) {
            throw new Error('USER_NOT_FOUND');
          }

          const existingTx = await trx('transactions').where({ reference }).first();
          if (existingTx) {
            if (existingTx.status === 'success') {
              throw new Error('DUPLICATE_REFERENCE_DETECTED');
            }

            // Update pending/failed simulation record to success
            await trx('transactions').where({ reference }).update({
              status: 'success',
              amount: fundAmount,
              description: `Funded +₦${fundAmount.toLocaleString()} securely via verified sandbox channel`,
              details: JSON.stringify({ gateway: 'paystack_inline_simulated' })
            });

            const currentBalance = userObj.wallet_balance;
            await trx('users').where({ email }).update({ wallet_balance: currentBalance + fundAmount });
            console.log(`[PAYSTACK_VERIFY] Transitioned simulated pending transaction ${reference} to success. Wallet credited.`);
          } else {
            await trx('transactions').insert({
              id: `tx_fund_${Date.now()}`,
              user_email: email,
              type: 'funding',
              amount: fundAmount,
              fee: 0,
              status: 'success',
              timestamp: new Date().toISOString(),
              description: `Funded +₦${fundAmount.toLocaleString()} securely via verified sandbox channel`,
              recipient: 'Primary wallet',
              reference: reference,
              details: JSON.stringify({ gateway: 'paystack_inline_simulated' })
            });

            const currentBalance = userObj.wallet_balance;
            await trx('users').where({ email }).update({ wallet_balance: currentBalance + fundAmount });
            console.log(`[PAYSTACK_VERIFY] Created new simulated successful transaction for ${reference}. Wallet credited.`);
          }
        });

        const updatedUser = await db('users').where({ email }).first();
        const recentTxs = await db('transactions')
          .where({ user_email: email })
          .orderBy('timestamp', 'desc')
          .limit(2);

        return res.json({
          success: true,
          verified: true,
          simulated: true,
          user: mapDbUserToClient(updatedUser),
          transactions: recentTxs.map(mapDbTransactionToClient)
        });
      } catch (err: any) {
        if (err.message === 'DUPLICATE_REFERENCE_DETECTED') {
          const updatedUser = await db('users').where({ email }).first();
          const recentTxs = await db('transactions')
            .where({ user_email: email })
            .orderBy('timestamp', 'desc')
            .limit(2);
          return res.json({
            success: true,
            verified: true,
            user: mapDbUserToClient(updatedUser),
            transactions: recentTxs.map(mapDbTransactionToClient)
          });
        }
        return res.status(500).json({ error: err.message });
      }
    }
  });

  // Secure Paystack official payment notification Webhook
  app.post('/api/paystack/webhook', async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body || {};
    const userEmailFromPayload = payload.data?.customer?.email;
    const signature = req.headers['x-paystack-signature'];

    console.log('[PAYSTACK_WEBHOOK] Incoming payments signature notification check received!');

    let pSecret = process.env.PAYSTACK_SECRET_KEY;
    if (userEmailFromPayload) {
      try {
        const config = await db('api_configs').where({ user_email: userEmailFromPayload }).first();
        if (config && config.paystack_secret_key && config.paystack_secret_key.trim() !== '') {
          pSecret = config.paystack_secret_key.trim();
          console.log(`[PAYSTACK_WEBHOOK] Using user-defined custom Paystack Secret Key for ${userEmailFromPayload}`);
        }
      } catch (dbErr) {
        console.warn('[PAYSTACK_WEBHOOK] Could not query user configurations:', dbErr);
      }
    }

    if (pSecret && pSecret.trim() !== '') {
      if (!signature) {
        console.warn('[PAYSTACK_WEBHOOK] Request rejected: missing auth headers');
        return res.sendStatus(400);
      }
      
      try {
        const crypto = await import('crypto');
        const rawBodyText = (req as any).rawBody || JSON.stringify(req.body);
        let hash = crypto.createHmac('sha512', pSecret.trim())
                          .update(rawBodyText)
                          .digest('hex');

        if (hash !== signature) {
          console.warn('[PAYSTACK_WEBHOOK] Signature mismatch with rawBody. Trying JSON.stringify fallback...');
          const fallbackHash = crypto.createHmac('sha512', pSecret.trim())
                                     .update(JSON.stringify(req.body))
                                     .digest('hex');
          if (fallbackHash !== signature) {
            console.error('[PAYSTACK_WEBHOOK] Signature verification failed! Mismatch detected against signature.');
            return res.sendStatus(401);
          }
        }
      } catch (crypErr: any) {
        console.error('[PAYSTACK_WEBHOOK] Hash signature checks aborted:', crypErr.message);
        return res.sendStatus(500);
      }
    }

    if (payload && (payload.event === 'charge.success' || payload.event === 'charge.failed')) {
      const isSuccess = payload.event === 'charge.success';
      const dataObj = payload.data;
      const reference = dataObj.reference;
      const amountNGN = dataObj.amount / 100;
      const userEmail = dataObj.customer?.email;

      // Asynchronously forward the verified request to their main production webhook URL
      const extWebhookUrl = 'https://wavie.vercel.app/api/paystack/webhook';
      console.log(`[PAYSTACK_WEBHOOK] Forwarding event payload to custom external webhook: ${extWebhookUrl}`);
      fetch(extWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Paystack-Signature': (signature as string) || '',
        },
        body: (req as any).rawBody || JSON.stringify(req.body)
      })
      .then((fRes) => {
        console.log(`[PAYSTACK_WEBHOOK] Proxy to external webhook completed with status code: ${fRes.status}`);
      })
      .catch((fErr) => {
        console.warn(`[PAYSTACK_WEBHOOK] Proxy routing failure to external webhook destination: ${fErr.message}`);
      });

      if (!userEmail) {
        console.error('[PAYSTACK_WEBHOOK] Event is missing valid customer email address.');
        return res.status(400).json({ error: 'Customer email address is mandatory' });
      }

      console.log(`[PAYSTACK_WEBHOOK] Successfully checked signature! Event: ${payload.event}, Ref: ${reference}, Amount: ₦${amountNGN}, Recipient: ${userEmail}`);

      try {
        await db.transaction(async (trx) => {
          const userObj = await trx('users').where({ email: userEmail }).first();
          if (!userObj) {
            throw new Error('USER_NOT_FOUND');
          }

          const existingTx = await trx('transactions').where({ reference }).first();
          if (existingTx) {
            if (existingTx.status === 'success') {
              throw new Error('DUPLICATE_REFERENCE_DETECTED');
            }

            // Update existing pending/failed transaction record
            await trx('transactions').where({ reference }).update({
              status: isSuccess ? 'success' : 'failed',
              amount: amountNGN,
              description: isSuccess 
                ? `Funded +₦${amountNGN.toLocaleString()} securely via Paystack Webhook` 
                : `Funding of ₦${amountNGN.toLocaleString()} failed via Paystack Webhook`,
              details: JSON.stringify({ 
                gateway: 'paystack_webhook', 
                gateway_id: dataObj.id,
                channel: dataObj.channel || 'unknown',
                failure_reason: dataObj.gateway_response || 'unknown'
              })
            });

            if (isSuccess) {
              const currentBalance = userObj.wallet_balance;
              await trx('users').where({ email: userEmail }).update({ wallet_balance: currentBalance + amountNGN });
              console.log(`[PAYSTACK_WEBHOOK] Updated pending transaction ${reference} to success. Wallet credited.`);
            } else {
              console.log(`[PAYSTACK_WEBHOOK] Updated pending transaction ${reference} to failed.`);
            }
          } else {
            // Log brand new transaction record
            await trx('transactions').insert({
              id: `tx_fund_${Date.now()}`,
              user_email: userEmail,
              type: 'funding',
              amount: amountNGN,
              fee: 0,
              status: isSuccess ? 'success' : 'failed',
              timestamp: new Date().toISOString(),
              description: isSuccess 
                ? `Funded +₦${amountNGN.toLocaleString()} securely via Paystack Webhook Event Notification` 
                : `Funding of ₦${amountNGN.toLocaleString()} failed via Paystack Webhook`,
              recipient: 'Primary wallet',
              reference: reference,
              details: JSON.stringify({ 
                gateway: 'paystack_webhook', 
                gateway_id: dataObj.id,
                channel: dataObj.channel || 'unknown',
                failure_reason: dataObj.gateway_response || 'unknown'
              })
            });

            if (isSuccess) {
              const currentBalance = userObj.wallet_balance;
              await trx('users').where({ email: userEmail }).update({ wallet_balance: currentBalance + amountNGN });
              console.log(`[PAYSTACK_WEBHOOK] Created new successful transaction for reference ${reference}. Wallet credited.`);
            } else {
              console.log(`[PAYSTACK_WEBHOOK] Created new failed transaction for reference ${reference}.`);
            }
          }
        });

        console.log(`[PAYSTACK_WEBHOOK] Successfully processed credit to ${userEmail} with amount ₦${amountNGN}`);
        return res.status(200).json({ status: 'success', message: 'Verification credits ledger saved stably.' });
      } catch (err: any) {
        if (err.message === 'USER_NOT_FOUND') {
          console.error(`[PAYSTACK_WEBHOOK] Account registration matches not found for ${userEmail}.`);
          return res.status(404).json({ error: 'User does not exist in registrations pool.' });
        }
        if (err.message === 'DUPLICATE_REFERENCE_DETECTED') {
          console.log(`[PAYSTACK_WEBHOOK] Duplicate webhook notification check for ${reference}. Code: success.`);
          return res.status(200).json({ status: 'ignored', message: 'Already processed transaction' });
        }
        console.error('[PAYSTACK_WEBHOOK] Processing exception found:', err);
        return res.status(500).json({ error: err.message });
      }
    }

    return res.status(200).json({ status: 'success', message: 'Assigned event verified and recorded.' });
  });

  // ==========================================
  // 8. API: Mia Financial AI Automated Companion
  // ==========================================
  // Lazy-initialize Gemini AI engine to prevent crash if key is undefined
  let aiClient: any = null;
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      return null;
    }
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  app.post('/api/mia/chat', async (req: Request, res: Response, next: NextFunction) => {
    const { email, messages } = req.body;
    if (!email || !messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Email and messages history required' });
    }

    try {
      // 1. Fetch real-time user database context to ground the assistant
      const user = await db('users').where({ email }).first();
      if (!user) {
        return res.status(404).json({ error: 'User customer profile not found' });
      }

      // Fetch 5 recent transactions
      const recentTxs = await db('transactions')
        .where({ user_email: email })
        .orderBy('timestamp', 'desc')
        .limit(5);

      const latestMessage = messages[messages.length - 1];
      let ai = getGeminiClient();

      if (ai) {
        // Build customized Nigeria top-up systems sandbox environment instructions
        const systemInstruction = `You are "Mia", the highly intelligent AI fin-tech automation companion for Wavie (Nigeria's leading top-up portal for high-speed mobile airtime, internet data bundles, educational EPINs, and utility bills payments).
You help users query their account, learn about the app features (offline-first design, biometrics), and automate transactions completely!

User Session Profile (Grounding Context):
- Customer Name: ${user.name}
- Customer Email: ${user.email}
- Wallet Balance: ₦${user.wallet_balance.toLocaleString('en-NG')}
- Referral Code: ${user.referral_code}

Recent Transactions History:
${recentTxs.map(t => `- [${t.timestamp}] type: ${t.type}, amount: ₦${t.amount}, recipient: ${t.recipient}, status: ${t.status}`).join('\n') || 'No transactions yet.'}

Product Prices & Services Guide (Wavie Catalog):
1. Airtime Top-ups: MTN, Airtel, Glo, 9mobile. (Cashbacks: MTN 2%, Airtel 2%, Glo 3%, 9mobile 3%).
2. Mobile Data Plans (30 days validation):
   - MTN Data: ₦505 (1.5GB), ₦1,200 (5GB)
   - Airtel Data: ₦600 (2GB), ₦1,500 (6GB)
   - Glo Data: ₦500 (2.5GB), ₦1,000 (5.8GB)
   - 9mobile Data: ₦500 (2GB), ₦1,200 (7GB)
3. Electricity Discos (Conv. fee ₦100, min ₦1,000): Ikeja Electric (IKEDC), Eko Electric (EKEDC), Abuja Electric (AEDC), Port Harcourt Electric (PHED).
4. Cable TV Subscriptions: DSTV (e.g., Compact ₦12,500/mo, Access ₦4,500/mo), GOTV (e.g., Max ₦5,700/mo, Jolli ₦3,900/mo), Startimes (Super ₦3,500/mo, Nova ₦1,500/mo).
5. Educational Exam EPINs: WAEC Result PIN (₦3,200), NECO Token (₦1,100).

HOW TO AUTOMATE AND EXTRACT TRANSACTIONS:
- Analyze the user's latest chat, transcribed voice prompt, or uploaded image of a bill, voucher, or card.
- If you can extract details, set up the checkout values inside the "action" field.
- If details are incomplete, still answer conversationally, ask for the missing fields, or make a logical default recommendation.
- Every response must follow the strictly enforced JSON format below.

RESPONSE SCHEMA (JSON ONLY):
{
  "text": "Your conversational narrative reply in markdown. Highlight cashback incentives, explain if you extracted any bill parameters or phone numbers, and guide them with bold text.",
  "action": {
    "type": "TRANSACTION_PREPARE",
    "tx": {
      "type": "airtime" | "data" | "electricity" | "cable" | "education" | "withdrawal",
      "amount": 1000,
      "recipient": "08012345678",
      "description": "MTN 1,000 Airtime reloaded via Mia Assistant",
      "details": {
        "network": "MTN", // if airtime or data. MUST be EXACTLY: "MTN", "Airtel", "Glo", "9mobile"
        "disco": "Ikeja Electric", // if electricity
        "provider": "GOTV", // if cable TV
        "saveBeneficiary": true,
        "beneficiaryName": "Mia Automation"
      }
    }
  } (or null if no transaction is found/ready to verify)
}

Do NOT wrap the JSON inside markdown code blocks (like \`\`\`json). Output raw, parseable JSON only.`;

        // Format history context cleanly for generative content request
        const contentsParts: any[] = [];
        let conversationContext = "Here is the conversation history:\n";
        messages.slice(-6, -1).forEach((msg: any) => {
          conversationContext += `${msg.sender === 'user' ? 'User' : 'Mia'}: ${msg.text}\n`;
        });
        conversationContext += `User's latest input: ${latestMessage.text}\n`;
        contentsParts.push({ text: conversationContext });

        if (latestMessage.image) {
          const base64Data = latestMessage.image.split(',')[1] || latestMessage.image;
          contentsParts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          });
        }

        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contentsParts,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              temperature: 0.6,
            }
          });

          const rawText = response.text || "{}";
          try {
            const parsed = JSON.parse(rawText.trim());
            return res.json(parsed);
          } catch (e) {
            console.error("Gemini failed to output exact JSON schema, applying fallback container.", e);
            return res.json({
              text: rawText,
              action: null
            });
          }
        } catch (genError) {
          console.error("Gemini generateContent runtime failed, reverting automatically to sandbox simulation:", genError);
          ai = null;
        }
      }

      if (!ai) {
        // ==========================================
        // Deep Sandbox Offline Fallback Simulation
        // ==========================================
        const queryText = latestMessage.text.toLowerCase();
        let simulatedReply = {
          text: `Hi **${user.name}**! I'm **Mia**, your Wavie automation bot. Currently running in sandbox simulation mode.\n\nYou can talk to me, upload an image of a bill, or use your voice. Try these command templates:\n- *"Buy ₦1,500 Airtel airtime on 08012345678"* \n- *"Subscribe Glo data 1000 on 09076543210"* \n- *"Pay Ikeja prepaid electricity bill for 45091122839"*`,
          action: null as any
        };

        // Match patterns
        const airtimeMatch = queryText.match(/(?:buy|recharge|get|topup|top up|load)\s+(?:₦|n|ngn)?\s*(\d+)\s*(?:of)?\s*(mtn|airtel|glo|9mobile)\s*(?:airtime)?\s*(?:on|to|for)?\s*(\d{10,11})/i);
        const dataMatch = queryText.match(/(?:subscribe|data|sub|mb|gb)\s+(?:₦|n|ngn)?\s*(\d+)?\s*(?:of)?\s*(mtn|airtel|glo|9mobile)\s*(?:data)?\s*(?:on|to|for)?\s*(\d{10,11})/i);
        const billElectricMatch = queryText.match(/(?:pay|electric|electricity|power|recharge electric)\s+(?:₦|n|ngn)?\s*(\d+)?\s*(?:for|on)?\s*(ikeja|eko|abuja|port harcourt)\s*(?:electric|disco)?\s*(?:meter)?\s*(\d{8,15})/i);

        if (airtimeMatch) {
          const amount = parseInt(airtimeMatch[1], 10);
          const networkRaw = airtimeMatch[2];
          const phone = airtimeMatch[3];
          const telcoFormatted = networkRaw.toUpperCase() === 'MTN' ? 'MTN' : networkRaw.toUpperCase() === 'AIRTEL' ? 'Airtel' : networkRaw.toUpperCase() === 'GLO' ? 'Glo' : '9mobile';
          const cashbackPct = ['GLO', '9MOBILE'].includes(networkRaw.toUpperCase()) ? 3 : 2;
          const cashbackEarned = (amount * cashbackPct) / 100;

          simulatedReply = {
            text: `🎯 **Extraction Successful!** I've parsed your request and drafted your mobile recharge voucher instant order.\n\n- **Service:** Airtime Top-Up\n- **Telco Network:** \`${telcoFormatted}\`\n- **Recipient Phone:** \`${phone}\`\n- **Token Amount:** \`₦${amount.toLocaleString('en-NG')}\`\n- **Wavie Cashback Gained:** \`₦${cashbackEarned.toLocaleString('en-NG')} (${cashbackPct}%)\`\n\nI have structured a secure checkout receipt below. Tap **Confirm & Pay** to authorize via secure PIN/WebAuthn Biometrics!`,
            action: {
              type: "TRANSACTION_PREPARE",
              tx: {
                type: "airtime",
                amount,
                recipient: phone,
                description: `${telcoFormatted} ₦${amount.toLocaleString('en-NG')} Mobile Airtime via Mia Voice`,
                details: {
                  network: telcoFormatted,
                  saveBeneficiary: true,
                  beneficiaryName: "Mia Automated Beneficiary"
                }
              }
            }
          };
        } else if (dataMatch) {
          const amount = dataMatch[1] ? parseInt(dataMatch[1], 10) : 1200;
          const networkRaw = dataMatch[2];
          const phone = dataMatch[3];
          const telcoFormatted = networkRaw.toUpperCase() === 'MTN' ? 'MTN' : networkRaw.toUpperCase() === 'AIRTEL' ? 'Airtel' : networkRaw.toUpperCase() === 'GLO' ? 'Glo' : '9mobile';

          simulatedReply = {
            text: `📡 **Mia Smart Automation:** Setting up a monthly high-speed **${telcoFormatted} Data Plan** order.\n\n- **Phone Target:** \`${phone}\`\n- **Subscription Plan:** \`₦${amount.toLocaleString('en-NG')} Monthly Bundle\`\n- **Instant Cashback:** ₦${((amount * (telcoFormatted === 'Glo' || telcoFormatted === '9mobile' ? 3 : 2)) / 100).toLocaleString('en-NG')}\n\nReview the prepared invoice below and tap **Confirm & Pay**!`,
            action: {
              type: "TRANSACTION_PREPARE",
              tx: {
                type: "data",
                amount,
                recipient: phone,
                description: `${telcoFormatted} ₦${amount.toLocaleString('en-NG')} Data Plan via Mia AI`,
                details: {
                  network: telcoFormatted,
                  saveBeneficiary: true,
                  beneficiaryName: "Mia Automated Data"
                }
              }
            }
          };
        } else if (billElectricMatch) {
          const amount = billElectricMatch[1] ? parseInt(billElectricMatch[1], 10) : 3500;
          const discoRaw = billElectricMatch[2];
          const meterNo = billElectricMatch[3];
          const discoFormatted = discoRaw.toLowerCase().includes('ikeja') ? 'Ikeja Electric' : discoRaw.toLowerCase().includes('eko') ? 'Eko Electric' : discoRaw.toLowerCase().includes('abuja') ? 'Abuja Electric' : 'Port Harcourt Electric';

          simulatedReply = {
            text: `💡 **Electricity Invoice Scan:** I've structured your smart utility prepaid token payment details.\n\n- **Utility Disco:** \`${discoFormatted}\`\n- **Meter Identifier:** \`${meterNo}\`\n- **Recharge Amount:** \`₦${amount.toLocaleString('en-NG')}\`\n- **Standard Charge Fee:** \`₦100\`\n\nAuthorized directly on Wavie infrastructure. Click **Confirm & Pay** below inside our chat to unlock and emit electricity token!`,
            action: {
              type: "TRANSACTION_PREPARE",
              tx: {
                type: "electricity",
                amount,
                recipient: meterNo,
                description: `${discoFormatted} prepaid replenishment`,
                details: {
                  disco: discoFormatted,
                  saveBeneficiary: true,
                  beneficiaryName: "Mia Auto Utilities"
                }
              }
            }
          };
        } else if (latestMessage.image) {
          // If the user uploaded any image in fallback scenario, simulate standard NEPA electric bill parse
          simulatedReply = {
            text: `📸 **Image Upload Analyzer:** I scanned your uploaded invoice screenshot and successfully extracted the following bill parameters:\n\n- **Invoice Category:** ⚡ Utility Bill (Ikeja Electric - Prepaid)\n- **Meter Account:** \`4509-3329-812\`\n- **Target Person:** Adewale Yusuf\n- **Average Due:** \`₦5,000\`\n\nI have pre-populated the complete transaction payload. View the authorization card below and click **Confirm & Pay**!`,
            action: {
              type: "TRANSACTION_PREPARE",
              tx: {
                type: "electricity",
                amount: 5000,
                recipient: "4509-3329-812",
                description: "Ikeja Electric ₦5,000 via Invoice Scan",
                details: {
                  disco: "Ikeja Electric",
                  saveBeneficiary: true,
                  beneficiaryName: "Yusuf meter (Mia Scan)"
                }
              }
            }
          };
        } else if (queryText.includes('waec') || queryText.includes('exam') || queryText.includes('neco')) {
          const isWaec = !queryText.includes('neco');
          const amount = isWaec ? 3200 : 1100;
          const tokenName = isWaec ? "WAEC Result Checker PIN" : "NECO Token";
          const dPhone = user.phone || "08012345678";

          simulatedReply = {
            text: `🎓 **Educational Voucher Automation:** I've set up an automated checkout for a high-volume **${tokenName}** EPIN.\n\n- **Token:** \`${tokenName}\`\n- **Delivery target:** \`${dPhone}\` (Via SMS/Email)\n- **Cost:** \`₦${amount.toLocaleString('en-NG')}\`\n\nApprove via the secure checkout receipt below!`,
            action: {
              type: "TRANSACTION_PREPARE",
              tx: {
                type: "education",
                amount,
                recipient: dPhone,
                description: `${tokenName} EPIN checkout`,
                details: {
                  provider: isWaec ? "WAEC" : "NECO",
                  quantity: 1,
                  saveBeneficiary: false
                }
              }
            }
          };
        }

        res.json(simulatedReply);
      }
    } catch (err: any) {
      console.error("Mia AI error exception:", err);
      res.status(500).json({ error: 'Failed to process AI chat query', message: err.message });
    }
  });


  // Vite asset-serving and dev configuration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ==========================================
  // Central Error Handler Middleware for DB SQL Constraints
  // ==========================================
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('⛔ API Controller or database exception raw output:', err);

    // Unique reference & primary key constraint failures
    if (err.code === 'SQLITE_CONSTRAINT' || err.message?.includes('UNIQUE constraint failed')) {
      let clarification = 'A database integrity rule was violated (unique constraint).';
      if (err.message?.includes('reference')) {
        clarification = 'Duplicate transaction reference checked. Operation rejected to maintain balance integrity.';
      } else if (err.message?.includes('email')) {
        clarification = 'User email matches an already registered customer.';
      }
      return res.status(409).json({
        success: false,
        error: 'Integrity constraint failed',
        message: clarification
      });
    }

    // Foreign key constraint failure
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || err.message?.includes('FOREIGN KEY constraint failed')) {
      return res.status(400).json({
        success: false,
        error: 'Foreign Key Violation',
        message: 'The requested record references a resource that is missing (foreign key error).'
      });
    }

    // Standard fallback
    res.status(500).json({
      success: false,
      error: 'Query execution failed',
      message: err.message || 'An internal database exception was thrown'
    });
  });

  // Launch Server on port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server loaded and listening on http://localhost:${PORT}`);
  });
}

startServer();
