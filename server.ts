import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, runMigrations } from './src/db/sqlite.ts';

// Main Server Startup Function
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

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
          wallet_balance: 3000.0,
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

  // 2. API: Update User details
  app.post('/api/user/update', async (req: Request, res: Response, next: NextFunction) => {
    const { 
      email, name, phone, walletBalance, referralEarnings, referredCount, kycLevel, transactionPin, isPinSet 
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
