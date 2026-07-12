const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Simple migration runner.
 * Reads and executes SQL files from the migrations directory in order.
 */
async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const migrationsDir = path.join(__dirname, 'migrations');

  try {
    // Get all .sql files sorted by name
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`\n🗄️  Running ${files.length} migration(s)...\n`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`  ▶ ${file}`);
      await pool.query(sql);
      console.log(`  ✅ ${file} — done`);
    }

    console.log('\n✅ All migrations completed successfully!\n');
  } catch (err) {
    console.error(`\n❌ Migration failed: ${err.message}\n`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
