import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { sqliteDb } from './src/db/sqlite.ts';

// Main Server Startup Function
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // Database helper wrappers
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

  // 1. API: Get or Create User
  app.get('/api/user', async (req, res) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }

    try {
      let user = await sqliteDb.get<any>('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        // Create new user automatically
        const refCode = `TOPUP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-9G`;
        await sqliteDb.run(
          `INSERT INTO users (email, phone, name, wallet_balance, referral_code, referred_count, referral_earnings, kyc_level, transaction_pin, is_pin_set)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [email, '08000000000', 'New User', 3000.0, refCode, 0, 0.0, 'Tier 1', '1111', 1]
        );
        user = await sqliteDb.get<any>('SELECT * FROM users WHERE email = ?', [email]);
        console.log(`Created new user record for ${email}`);
      }

      res.json({ success: true, user: mapDbUserToClient(user) });
    } catch (err: any) {
      console.error('Failed to query user:', err.message);
      res.status(550).json({ error: 'Database error while retrieving user' });
    }
  });

  // 2. API: Update User details
  app.post('/api/user/update', async (req, res) => {
    const { 
      email, name, phone, walletBalance, referralEarnings, referredCount, kycLevel, transactionPin, isPinSet 
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required for profile updates' });
    }

    try {
      const existing = await sqliteDb.get<any>('SELECT * FROM users WHERE email = ?', [email]);
      if (!existing) {
        return res.status(404).json({ error: 'User profiles does not exist' });
      }

      const updatedName = name !== undefined ? name : existing.name;
      const updatedPhone = phone !== undefined ? phone : existing.phone;
      const updatedBalance = walletBalance !== undefined ? walletBalance : existing.wallet_balance;
      const updatedEarnings = referralEarnings !== undefined ? referralEarnings : existing.referral_earnings;
      const updatedRefCount = referredCount !== undefined ? referredCount : existing.referred_count;
      const updatedKyc = kycLevel !== undefined ? kycLevel : existing.kyc_level;
      const updatedPin = transactionPin !== undefined ? transactionPin : existing.transaction_pin;
      const updatedPinSet = isPinSet !== undefined ? (isPinSet ? 1 : 0) : existing.is_pin_set;

      await sqliteDb.run(
        `UPDATE users
         SET name = ?, phone = ?, wallet_balance = ?, referral_earnings = ?, referred_count = ?, kyc_level = ?, transaction_pin = ?, is_pin_set = ?
         WHERE email = ?`,
        [updatedName, updatedPhone, updatedBalance, updatedEarnings, updatedRefCount, updatedKyc, updatedPin, updatedPinSet, email]
      );

      const updatedUser = await sqliteDb.get<any>('SELECT * FROM users WHERE email = ?', [email]);
      res.json({ success: true, user: mapDbUserToClient(updatedUser) });
    } catch (err: any) {
      console.error('Failed to update user:', err.message);
      res.status(500).json({ error: 'Database update failed' });
    }
  });

  // 3. API: Fetch Transactions
  app.get('/api/transactions', async (req, res) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter mandatory' });
    }

    try {
      const dbTxList = await sqliteDb.all<any>(
        'SELECT * FROM transactions WHERE user_email = ? ORDER BY timestamp DESC',
        [email]
      );
      const mapped = dbTxList.map(mapDbTransactionToClient);
      res.json({ success: true, transactions: mapped });
    } catch (err: any) {
      console.error('Failed to query transactions:', err.message);
      res.status(500).json({ error: 'Database error while retrieving transactions' });
    }
  });

  // 4. API: Create Transaction (with wallet balance impact)
  app.post('/api/transactions/create', async (req, res) => {
    const { email, tx } = req.body;
    if (!email || !tx) {
      return res.status(400).json({ error: 'Email and transaction payload required' });
    }

    try {
      const user = await sqliteDb.get<any>('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        return res.status(404).json({ error: 'User does not exist' });
      }

      // Calculate transaction impact on wallet balance
      // If funding, cashbacks or referral_bonus -> wallet goes up
      // Otherwise -> wallet goes down by (amount + fee)
      const charge = tx.amount + (tx.fee || 0);
      let newBalance = user.wallet_balance;

      if (tx.status === 'success') {
        if (tx.type === 'funding' || tx.type === 'referral_bonus' || tx.type === 'cashback') {
          newBalance += tx.amount;
        } else {
          if (newBalance < charge) {
            return res.status(400).json({ error: 'Insufficient funds in wallet' });
          }
          newBalance -= charge;
        }
      }

      // 1. Insert transaction record
      const detailsStr = tx.details ? JSON.stringify(tx.details) : null;
      await sqliteDb.run(
        `INSERT INTO transactions (id, user_email, type, amount, fee, status, timestamp, description, recipient, reference, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tx.id, email, tx.type, tx.amount, tx.fee || 0, tx.status, tx.timestamp, tx.description, tx.recipient, tx.reference, detailsStr]
      );

      // 2. Update user's wallet balance
      await sqliteDb.run('UPDATE users SET wallet_balance = ? WHERE email = ?', [newBalance, email]);

      const updatedUser = await sqliteDb.get<any>('SELECT * FROM users WHERE email = ?', [email]);
      res.json({ 
        success: true, 
        user: mapDbUserToClient(updatedUser),
        transaction: mapDbTransactionToClient(tx)
      });
    } catch (err: any) {
      console.error('Failed to write transaction:', err.message);
      res.status(500).json({ error: 'Database transaction insertion failed' });
    }
  });

  // 5. API: Fetch Saved Beneficiaries
  app.get('/api/beneficiaries', async (req, res) => {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter mandatory' });
    }

    try {
      const dbBens = await sqliteDb.all<any>(
        'SELECT * FROM beneficiaries WHERE user_email = ?',
        [email]
      );
      const mapped = dbBens.map((b) => ({
        id: b.id,
        type: b.type,
        name: b.name,
        value: b.value,
        provider: b.provider
      }));
      res.json({ success: true, beneficiaries: mapped });
    } catch (err: any) {
      console.error('Failed to query beneficiaries:', err.message);
      res.status(500).json({ error: 'Database error retrieving beneficiaries' });
    }
  });

  // 6. API: Add Saved Beneficiary
  app.post('/api/beneficiaries/create', async (req, res) => {
    const { email, beneficiary } = req.body;
    if (!email || !beneficiary) {
      return res.status(400).json({ error: 'Email and beneficiary data required' });
    }

    try {
      await sqliteDb.run(
        `INSERT INTO beneficiaries (id, user_email, type, name, value, provider)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [beneficiary.id, email, beneficiary.type, beneficiary.name, beneficiary.value, beneficiary.provider || '']
      );
      res.json({ success: true, beneficiary });
    } catch (err: any) {
      console.error('Failed to save beneficiary:', err.message);
      res.status(500).json({ error: 'Database error saving beneficiary' });
    }
  });

  // 7. API: Delete Saved Beneficiary
  app.post('/api/beneficiaries/delete', async (req, res) => {
    const { email, id } = req.body;
    if (!email || !id) {
      return res.status(400).json({ error: 'Email and beneficiary id required' });
    }

    try {
      await sqliteDb.run(
        'DELETE FROM beneficiaries WHERE id = ? AND user_email = ?',
        [id, email]
      );
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      console.error('Failed to delete beneficiary:', err.message);
      res.status(500).json({ error: 'Database error deleting beneficiary' });
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Launch Server on port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server loaded and listening on http://localhost:${PORT}`);
  });
}

startServer();
