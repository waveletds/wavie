import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'app.sqlite');

// Initialize sqlite3 Verbose mode
const sqliteVerbose = sqlite3.verbose();

// Promise wrapper for SQLite operations
class AsyncSqlite {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqliteVerbose.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Failed to open database:', err.message);
      } else {
        console.log('Database opened successfully at', DB_PATH);
        this.initTables();
      }
    });
  }

  private initTables() {
    this.db.serialize(() => {
      // 1. Users Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          phone TEXT NOT NULL,
          name TEXT NOT NULL,
          wallet_balance REAL DEFAULT 0.0,
          referral_code TEXT,
          referred_count INTEGER DEFAULT 0,
          referral_earnings REAL DEFAULT 0.0,
          kyc_level TEXT DEFAULT 'Tier 1',
          transaction_pin TEXT DEFAULT '1111',
          is_pin_set INTEGER DEFAULT 1
        )
      `, (err) => {
        if (err) console.error('Error creating users table:', err.message);
        else this.seedDefaultUser();
      });

      // 2. Transactions Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          user_email TEXT NOT NULL,
          type TEXT NOT NULL,
          amount REAL NOT NULL,
          fee REAL DEFAULT 0.0,
          status TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          description TEXT NOT NULL,
          recipient TEXT NOT NULL,
          reference TEXT NOT NULL,
          details TEXT, -- JSON String
          FOREIGN KEY (user_email) REFERENCES users (email) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating transactions table:', err.message);
        else this.seedDefaultTransactions();
      });

      // 3. Beneficiaries Table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS beneficiaries (
          id TEXT PRIMARY KEY,
          user_email TEXT NOT NULL,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          value TEXT NOT NULL,
          provider TEXT,
          FOREIGN KEY (user_email) REFERENCES users (email) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Error creating beneficiaries table:', err.message);
        else this.seedDefaultBeneficiaries();
      });
    });
  }

  private seedDefaultUser() {
    const checkQuery = `SELECT id FROM users WHERE email = ?`;
    const defaultEmail = 'iqleadsbloger@gmail.com';
    this.db.get(checkQuery, [defaultEmail], (err, row) => {
      if (err) {
        console.error('Error checking default user:', err.message);
        return;
      }
      if (!row) {
        const insertQuery = `
          INSERT INTO users (email, phone, name, wallet_balance, referral_code, referred_count, referral_earnings, kyc_level, transaction_pin, is_pin_set)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        this.db.run(insertQuery, [
          defaultEmail,
          '08034567890',
          'Olawale Joseph',
          24750.0,
          'TOPUP-9NGA-77',
          3,
          1500.0,
          'Tier 1',
          '1111',
          1
        ], (insertErr) => {
          if (insertErr) console.error('Error seeding default user:', insertErr.message);
          else console.log('Default user seeded successfully!');
        });
      }
    });
  }

  private seedDefaultTransactions() {
    const checkQuery = `SELECT COUNT(*) as count FROM transactions`;
    const defaultEmail = 'iqleadsbloger@gmail.com';
    this.db.get(checkQuery, [], (err, row: any) => {
      if (err) {
        console.error('Error checking transactions:', err.message);
        return;
      }
      if (row && row.count === 0) {
        const stmt = this.db.prepare(`
          INSERT INTO transactions (id, user_email, type, amount, fee, status, timestamp, description, recipient, reference, details)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          'tx1',
          defaultEmail,
          'funding',
          15000.0,
          0.0,
          'success',
          new Date(Date.now() - 3600000 * 24).toISOString(),
          'Dynamic Virtual Bank Auto-Funding',
          'Wema Bank Auto-Link',
          'TN-FUND-83910839',
          null
        );

        stmt.run(
          'tx2',
          defaultEmail,
          'airtime',
          1000.0,
          0.0,
          'success',
          new Date(Date.now() - 3600000 * 5).toISOString(),
          'MTN Airtime purchase for 08033221144',
          '08033221144',
          'TN-AIR-33041928',
          JSON.stringify({ network: 'MTN' })
        );

        stmt.run(
          'tx3',
          defaultEmail,
          'data',
          1200.0,
          0.0,
          'success',
          new Date(Date.now() - 3600000 * 2).toISOString(),
          'Airtel Monthly Bundle 2GB',
          '08129876543',
          'TN-DAT-22091823',
          JSON.stringify({ network: 'Airtel', planName: 'Monthly Standard 2GB' })
        );

        stmt.finalize((finalizeErr) => {
          if (finalizeErr) console.error('Error finalize tx seeding:', finalizeErr.message);
          else console.log('Default transactions seeded successfully!');
        });
      }
    });
  }

  private seedDefaultBeneficiaries() {
    const checkQuery = `SELECT COUNT(*) as count FROM beneficiaries`;
    const defaultEmail = 'iqleadsbloger@gmail.com';
    this.db.get(checkQuery, [], (err, row: any) => {
      if (err) {
        console.error('Error checking beneficiaries:', err.message);
        return;
      }
      if (row && row.count === 0) {
        const stmt = this.db.prepare(`
          INSERT INTO beneficiaries (id, user_email, type, name, value, provider)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run('b1', defaultEmail, 'phone', 'Grandma Glo', '08051234567', 'Glo');
        stmt.run('b2', defaultEmail, 'phone', 'Study Sim (Airtel)', '08129876543', 'Airtel');
        stmt.run('b3', defaultEmail, 'meter', 'Apartment prepaid', '54120987654', 'Ikeja Electric (IKEDC)');
        stmt.run('b4', defaultEmail, 'iuc', 'Parlour DSTV', '10987654321', 'DStv (MultiChoice)');

        stmt.finalize((finalizeErr) => {
          if (finalizeErr) console.error('Error finalize beneficiaries seeding:', finalizeErr.message);
          else console.log('Default beneficiaries seeded successfully!');
        });
      }
    });
  }

  // Operation Executers
  public run(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  public get<T>(sql: string, params: any[] = []): Promise<T | null> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve((row as T) || null);
      });
    });
  }

  public all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve((rows as T[]) || []);
      });
    });
  }
}

export const sqliteDb = new AsyncSqlite();
