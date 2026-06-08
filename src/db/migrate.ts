import { runMigrations, db } from './sqlite.ts';

// CLI / Script Entry to run formal database schema migrations and validation
async function execMigrationScript() {
  try {
    console.log('🏁 Initiating database schema check and migrations...');
    await runMigrations();
    console.log('🎉 Database migrations structured successfully.');
    process.exit(0);
  } catch (error) {
    console.error('⛔ Critical migration failure:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run if directly executed
execMigrationScript();
