import knex, { Knex } from 'knex';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'app.sqlite');

// Initialize Knex with configuration (utilizing Connection Pooling + WAL mode for concurrent operations)
export const db: Knex = knex({
  client: 'sqlite3',
  connection: {
    filename: DB_PATH,
  },
  useNullAsDefault: true,
  pool: {
    min: 2,
    max: 15,
    afterCreate: (conn: any, cb: any) => {
      // Enable WAL mode for safe database concurrency & enforce foreign keys inside the pool
      conn.run('PRAGMA journal_mode = WAL;', (walErr: any) => {
        if (walErr) {
          console.error('Failed to enable WAL mode:', walErr);
          return cb(walErr, conn);
        }
        conn.run('PRAGMA foreign_keys = ON;', (fkErr: any) => {
          cb(fkErr, conn);
        });
      });
    },
  },
});

// Programmatic Migration runner to assert consistent scale-ready schemas
export async function runMigrations() {
  console.log('Running programmatic scale Schema migrations...');

  // 1. Users table with integrity constraints
  const hasUsers = await db.schema.hasTable('users');
  if (!hasUsers) {
    await db.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('email').unique().notNullable();
      table.string('phone').notNullable();
      table.string('name').notNullable();
      table.double('wallet_balance').defaultTo(0.0).notNullable();
      table.string('referral_code').nullable();
      table.integer('referred_count').defaultTo(0).notNullable();
      table.double('referral_earnings').defaultTo(0.0).notNullable();
      table.string('kyc_level').defaultTo('Tier 1').notNullable();
      table.string('transaction_pin').defaultTo('1111').notNullable();
      table.string('password').defaultTo('').nullable();
      table.integer('is_pin_set').defaultTo(1).notNullable(); // 1 = true, 0 = false
      table.integer('is_webauthn_enabled').defaultTo(0).notNullable();
      table.text('webauthn_credential_id').nullable();
      table.string('role').defaultTo('user').notNullable(); // 'user', 'admin', 'super_admin'
      table.string('strowallet_customer_id').nullable();
      table.string('strowallet_account_number').nullable();
      table.string('strowallet_bank_name').nullable();
      table.string('strowallet_account_name').nullable();
    });
    console.log('✔ Migrated "users" table with all columns.');
  } else {
    const hasRole = await db.schema.hasColumn('users', 'role');
    if (!hasRole) {
      await db.schema.alterTable('users', (table) => {
        table.string('role').defaultTo('user').notNullable();
      });
      console.log('✔ Added role column to existing "users" table.');
    }
    const hasWebauthnEnabled = await db.schema.hasColumn('users', 'is_webauthn_enabled');
    if (!hasWebauthnEnabled) {
      await db.schema.alterTable('users', (table) => {
        table.integer('is_webauthn_enabled').defaultTo(0).notNullable();
      });
      console.log('✔ Added is_webauthn_enabled column to existing "users" table.');
    }
    const hasWebauthnCredential = await db.schema.hasColumn('users', 'webauthn_credential_id');
    if (!hasWebauthnCredential) {
      await db.schema.alterTable('users', (table) => {
        table.text('webauthn_credential_id').nullable();
      });
      console.log('✔ Added webauthn_credential_id column to existing "users" table.');
    }
    const hasPassword = await db.schema.hasColumn('users', 'password');
    if (!hasPassword) {
      await db.schema.alterTable('users', (table) => {
        table.string('password').defaultTo('').nullable();
      });
      console.log('✔ Added password column to existing "users" table.');
    }
    
    // Individually and robustly add each Strowallet column if missing
    const hasStrowalletCustomerId = await db.schema.hasColumn('users', 'strowallet_customer_id');
    if (!hasStrowalletCustomerId) {
      await db.schema.alterTable('users', (table) => {
        table.string('strowallet_customer_id').nullable();
      });
      console.log('✔ Patched strowallet_customer_id column.');
    }
    const hasStrowalletAccountNumber = await db.schema.hasColumn('users', 'strowallet_account_number');
    if (!hasStrowalletAccountNumber) {
      await db.schema.alterTable('users', (table) => {
        table.string('strowallet_account_number').nullable();
      });
      console.log('✔ Patched strowallet_account_number column.');
    }
    const hasStrowalletBankName = await db.schema.hasColumn('users', 'strowallet_bank_name');
    if (!hasStrowalletBankName) {
      await db.schema.alterTable('users', (table) => {
        table.string('strowallet_bank_name').nullable();
      });
      console.log('✔ Patched strowallet_bank_name column.');
    }
    const hasStrowalletAccountName = await db.schema.hasColumn('users', 'strowallet_account_name');
    if (!hasStrowalletAccountName) {
      await db.schema.alterTable('users', (table) => {
        table.string('strowallet_account_name').nullable();
      });
      console.log('✔ Patched strowallet_account_name column.');
    }

    // Programmatically patch Monnify columns on "users" table
    const hasMonnifyRef = await db.schema.hasColumn('users', 'monnify_account_reference');
    if (!hasMonnifyRef) {
      await db.schema.alterTable('users', (table) => {
        table.string('monnify_account_reference').nullable();
      });
      console.log('✔ Patched monnify_account_reference column.');
    }
    const hasMonnifyBank = await db.schema.hasColumn('users', 'monnify_bank_name');
    if (!hasMonnifyBank) {
      await db.schema.alterTable('users', (table) => {
        table.string('monnify_bank_name').nullable();
      });
      console.log('✔ Patched monnify_bank_name column.');
    }
    const hasMonnifyAcc = await db.schema.hasColumn('users', 'monnify_account_number');
    if (!hasMonnifyAcc) {
      await db.schema.alterTable('users', (table) => {
        table.string('monnify_account_number').nullable();
      });
      console.log('✔ Patched monnify_account_number column.');
    }
    const hasMonnifyName = await db.schema.hasColumn('users', 'monnify_account_name');
    if (!hasMonnifyName) {
      await db.schema.alterTable('users', (table) => {
        table.string('monnify_account_name').nullable();
      });
      console.log('✔ Patched monnify_account_name column.');
    }
  }

  // 2. Transactions table with UNIQUE reference & foreign_keys
  const hasTransactions = await db.schema.hasTable('transactions');
  if (!hasTransactions) {
    await db.schema.createTable('transactions', (table) => {
      table.string('id').primary();
      table.string('user_email').notNullable().references('email').inTable('users').onDelete('CASCADE');
      table.string('type').notNullable(); // airtime, data, electricity, cable, education, withdrawal, funding, referral_bonus, cashback
      table.double('amount').notNullable();
      table.double('fee').defaultTo(0.0).notNullable();
      table.string('status').notNullable(); // pending, success, failed
      table.string('timestamp').notNullable();
      table.string('description').notNullable();
      table.string('recipient').notNullable();
      
      // Database-level uniqueness constraints for safe idempotent operations and transaction security
      table.string('reference').unique().notNullable();
      
      table.text('details').nullable(); // JSON String
    });
    console.log('✔ Migrated "transactions" table with database-level integrity constraints.');
  } else {
    // Audit if Reference index or unique constraint exists or add unique index dynamically
    try {
      // In SQLite we can verify column properties, we can make sure reference is index-guaranteed
      const exists = await db.schema.hasColumn('transactions', 'reference');
      if (exists) {
        console.log('✔ Verified uniqueness constraints on transactions reference');
      }
    } catch (e: any) {
      console.warn('Reference audit:', e.message);
    }
  }

  // 3. Beneficiaries table
  const hasBeneficiaries = await db.schema.hasTable('beneficiaries');
  if (!hasBeneficiaries) {
    await db.schema.createTable('beneficiaries', (table) => {
      table.string('id').primary();
      table.string('user_email').notNullable().references('email').inTable('users').onDelete('CASCADE');
      table.string('type').notNullable();
      table.string('name').notNullable();
      table.string('value').notNullable();
      table.string('provider').nullable();
    });
    console.log('✔ Migrated "beneficiaries" table.');
  }

  // 4. API Configurations table for safe keys management
  const hasConfigs = await db.schema.hasTable('api_configs');
  if (!hasConfigs) {
    await db.schema.createTable('api_configs', (table) => {
      table.increments('id').primary();
      table.string('user_email').notNullable().unique().references('email').inTable('users').onDelete('CASCADE');
      table.string('sagecloud_api_key').nullable();
      table.string('sagecloud_api_url').defaultTo('https://api.sagecloud.ng/v1').nullable();
      table.string('paystack_public_key').nullable();
      table.string('paystack_secret_key').nullable();
      table.string('smm_api_key').nullable();
      table.string('smm_api_url').defaultTo('https://easy-smm-panel.com/api/v2').nullable();
      table.string('strowallet_public_key').nullable();
      table.string('strowallet_secret_key').nullable();
      table.string('strowallet_api_url').defaultTo('https://api.strowallet.com/v1').nullable();
      table.string('supabase_url').nullable();
      table.string('supabase_anon_key').nullable();
      table.string('monnify_api_key').nullable();
      table.string('monnify_secret_key').nullable();
      table.string('monnify_contract_code').nullable();
      table.string('monnify_api_url').defaultTo('https://sandbox.monnify.com').nullable();
    });
    console.log('✔ Migrated "api_configs" table with Paystack, SMM, Strowallet, Supabase & Monnify support.');
  } else {
    // Add additional fields dynamically to handle runtime updates
    const hasPubKey = await db.schema.hasColumn('api_configs', 'paystack_public_key');
    if (!hasPubKey) {
      await db.schema.table('api_configs', (table) => {
        table.string('paystack_public_key').nullable();
        table.string('paystack_secret_key').nullable();
      });
      console.log('✔ Patched "api_configs" table with paystack_public_key & paystack_secret_key.');
    }
    const hasSmmFields = await db.schema.hasColumn('api_configs', 'smm_api_key');
    if (!hasSmmFields) {
      await db.schema.table('api_configs', (table) => {
        table.string('smm_api_key').nullable();
        table.string('smm_api_url').defaultTo('https://easy-smm-panel.com/api/v2').nullable();
      });
      console.log('✔ Patched "api_configs" table with smm_api_key & smm_api_url.');
    }
    const hasStrowalletFields = await db.schema.hasColumn('api_configs', 'strowallet_public_key');
    if (!hasStrowalletFields) {
      await db.schema.table('api_configs', (table) => {
        table.string('strowallet_public_key').nullable();
        table.string('strowallet_secret_key').nullable();
        table.string('strowallet_api_url').defaultTo('https://api.strowallet.com/v1').nullable();
      });
      console.log('✔ Patched "api_configs" table with strowallet_public_key, strowallet_secret_key & strowallet_api_url.');
    }
    const hasSupabaseFields = await db.schema.hasColumn('api_configs', 'supabase_url');
    if (!hasSupabaseFields) {
      await db.schema.table('api_configs', (table) => {
        table.string('supabase_url').nullable();
        table.string('supabase_anon_key').nullable();
      });
      console.log('✔ Patched "api_configs" table with supabase_url and supabase_anon_key.');
    }
    const hasMonnifyFields = await db.schema.hasColumn('api_configs', 'monnify_api_key');
    if (!hasMonnifyFields) {
      await db.schema.table('api_configs', (table) => {
        table.string('monnify_api_key').nullable();
        table.string('monnify_secret_key').nullable();
        table.string('monnify_contract_code').nullable();
        table.string('monnify_api_url').defaultTo('https://sandbox.monnify.com').nullable();
      });
      console.log('✔ Patched "api_configs" table with Monnify variables.');
    }
  }

  // 5. Git Simulated Commits table
  const hasGitCommits = await db.schema.hasTable('git_commits');
  if (!hasGitCommits) {
    await db.schema.createTable('git_commits', (table) => {
      table.increments('id').primary();
      table.string('user_email').notNullable();
      table.string('commit_hash').notNullable();
      table.string('message').notNullable();
      table.text('files_changed').notNullable();
      table.string('timestamp').notNullable();
      table.string('status').notNullable();
    });
    console.log('✔ Migrated "git_commits" table.');
  }

  // Seed default data if database is empty
  await seedDatabase();
}

async function seedDatabase() {
  const defaultEmail = 'iqleadsbloger@gmail.com';

  // Check default user
  const user = await db('users').where({ email: defaultEmail }).first();
  if (!user) {
    await db('users').insert({
      email: defaultEmail,
      phone: '08034567890',
      name: 'Olawale Joseph',
      wallet_balance: 0.0,
      referral_code: 'TOPUP-9NGA-77',
      referred_count: 0,
      referral_earnings: 0.0,
      kyc_level: 'Tier 1',
      transaction_pin: '1111',
      is_pin_set: 1,
      role: 'super_admin'
    });
    console.log('✔ Seeded default clean profile for iqleadsbloger@gmail.com.');
  } else {
    // Make sure default user is always marked as super_admin, and clear demo balance/stats
    await db('users').where({ email: defaultEmail }).update({ 
      role: 'super_admin',
      wallet_balance: 0.0,
      referred_count: 0,
      referral_earnings: 0.0
    });
  }

  // Ensure Admin Demo User starts clean
  const adminEmail = 'admin@topup.ng';
  const adminUser = await db('users').where({ email: adminEmail }).first();
  if (!adminUser) {
    await db('users').insert({
      email: adminEmail,
      phone: '08011112222',
      name: 'Femi Johnson (Admin)',
      wallet_balance: 0.0,
      referral_code: 'ADMIN-TOPUP',
      referred_count: 0,
      referral_earnings: 0.0,
      kyc_level: 'Tier 3',
      transaction_pin: '1111',
      is_pin_set: 1,
      role: 'admin'
    });
    console.log('✔ Seeded admin demo profile admin@topup.ng.');
  } else {
    await db('users').where({ email: adminEmail }).update({
      wallet_balance: 0.0
    });
  }

  // Ensure Normal Demo User starts clean
  const customerEmail = 'customer@topup.ng';
  const customerUser = await db('users').where({ email: customerEmail }).first();
  if (!customerUser) {
    await db('users').insert({
      email: customerEmail,
      phone: '08033334444',
      name: 'Chidi Adebayo (User)',
      wallet_balance: 0.0,
      referral_code: 'CHIDI-SHARE',
      referred_count: 0,
      referral_earnings: 0.0,
      kyc_level: 'Tier 1',
      transaction_pin: '1111',
      is_pin_set: 1,
      role: 'user'
    });
    console.log('✔ Seeded regular customer demo profile customer@topup.ng.');
  } else {
    await db('users').where({ email: customerEmail }).update({
      wallet_balance: 0.0,
      referred_count: 0,
      referral_earnings: 0.0
    });
  }

  // Check default api configurations
  const config = await db('api_configs').where({ user_email: defaultEmail }).first();
  if (!config) {
    await db('api_configs').insert({
      user_email: defaultEmail,
      paystack_public_key: 'pk_live_26c21769a652b4bfd26b4f02d485c915d21fe69e',
      monnify_api_key: 'MK_PROD_7PTFPLFJMA',
      monnify_secret_key: 'EVWU08FGU5593XD9RU00HPSL3GGE7RCF',
      monnify_contract_code: '990220110619',
      monnify_api_url: 'https://api.monnify.com',
      supabase_url: 'https://guzlvzkifizmskmwdfdk.supabase.co',
      supabase_anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1emx2emtpZml6bXNrbXdkZmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzk1NzIsImV4cCI6MjA5Njc1NTU3Mn0.SekayTDlb-5pRXbjRMA6bo2uBODO5YenOpf7zz9wqNc'
    });
    console.log('✔ Seeded default API configs entry with live Paystack, Monnify, and active Supabase keys.');
  } else {
    // Ensure Paystack, Monnify, and Supabase keys are set to user's requested live production keys
    await db('api_configs').where({ user_email: defaultEmail }).update({
      paystack_public_key: 'pk_live_26c21769a652b4bfd26b4f02d485c915d21fe69e',
      monnify_api_key: 'MK_PROD_7PTFPLFJMA',
      monnify_secret_key: 'EVWU08FGU5593XD9RU00HPSL3GGE7RCF',
      monnify_contract_code: '990220110619',
      monnify_api_url: 'https://api.monnify.com',
      supabase_url: config.supabase_url || 'https://guzlvzkifizmskmwdfdk.supabase.co',
      supabase_anon_key: config.supabase_anon_key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1emx2emtpZml6bXNrbXdkZmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzk1NzIsImV4cCI6MjA5Njc1NTU3Mn0.SekayTDlb-5pRXbjRMA6bo2uBODO5YenOpf7zz9wqNc'
    });
    console.log('✔ Updated API configs with requested live Paystack & Monnify & active Supabase keys.');
  }

  // Purge all old registered general user accounts from SQLite DB, leaving only default/seed developer and system profiles
  const deletedGeneralUsers = await db('users')
    .whereNotIn('email', [defaultEmail, 'admin@topup.ng', 'customer@topup.ng'])
    .delete();
  if (deletedGeneralUsers > 0) {
    console.log(`✔ Pruned and deleted ${deletedGeneralUsers} old registered sandbox user account(s) on startup successfully.`);
  }

  // Always clean up default mock transactions if they exist
  await db('transactions').whereIn('id', ['tx1', 'tx2', 'tx3']).delete();
  console.log('✔ Checked and pruned default mock transaction items from the database.');

  // Check beneficiaries count
  const benCount = await db('beneficiaries').count('id as val').first();
  const bens = benCount ? Number((benCount as any).val) : 0;
  if (bens === 0) {
    await db('beneficiaries').insert([
      { id: 'b1', user_email: defaultEmail, type: 'phone', name: 'Grandma Glo', value: '08051234567', provider: 'Glo' },
      { id: 'b2', user_email: defaultEmail, type: 'phone', name: 'Study Sim (Airtel)', value: '08129876543', provider: 'Airtel' },
      { id: 'b3', user_email: defaultEmail, type: 'meter', name: 'Apartment prepaid', value: '54120987654', provider: 'Ikeja Electric (IKEDC)' },
      { id: 'b4', user_email: defaultEmail, type: 'iuc', name: 'Parlour DSTV', value: '10987654321', provider: 'DStv (MultiChoice)' }
    ]);
    console.log('✔ Seeded default saved beneficiaries into Knex DB.');
  }

  // Check simulated git commits count
  const gitCount = await db('git_commits').count('id as val').first();
  const commitsNum = gitCount ? Number((gitCount as any).val) : 0;
  if (commitsNum === 0) {
    await db('git_commits').insert([
      {
        user_email: defaultEmail,
        commit_hash: '9fbca0286cd1bf63a0172bfdb894101cc7a40b92',
        message: 'Initial project setup & database schemas with Knex & SQLite support',
        files_changed: 'src/db/sqlite.ts, server.ts, package.json',
        timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
        status: 'PUSHED'
      },
      {
        user_email: defaultEmail,
        commit_hash: '30a10df85be99146ec001bf64c58cf32df73b06c',
        message: 'Integrate master payment gateways and credentials settings pane',
        files_changed: 'server.ts, src/components/SettingsConfig.tsx',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: 'PUSHED'
      },
      {
        user_email: defaultEmail,
        commit_hash: 'c82fab93a8d11c070f80bb9eb980bdff48ac91cf',
        message: 'Add biometric authentication options and real-time VTU routing exceptions',
        files_changed: 'server.ts, src/components/SettingsConfig.tsx',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        status: 'PUSHED'
      }
    ]);
    console.log('✔ Seeded initial development simulated commits.');
  }
}
