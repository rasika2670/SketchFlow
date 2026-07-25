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
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get applied migrations
    const { rows: appliedRows } = await pool.query('SELECT name FROM migrations');
    const appliedMigrations = new Set(appliedRows.map((r) => r.name));

    // Get all .sql files sorted by name
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pendingFiles = files.filter((f) => !appliedMigrations.has(f));

    if (pendingFiles.length === 0) {
      console.log('\n✅ Database is up to date. No new migrations to run.\n');
      return;
    }

    console.log(`\n🗄️  Running ${pendingFiles.length} migration(s)...\n`);

    for (const file of pendingFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`  ▶ ${file}`);
      
      // Since 001 and 002 were run before we added tracking, we can optionally catch errors if they are already applied. 
      // But we are only running pendingFiles which should include 001 and 002 if tracking table is newly created.
      // Wait, if the tracking table is NEW, pendingFiles will include 001 and 002, and running them will fail.
      // So if running a migration fails because objects exist, we can mark it as applied anyway (simple workaround for existing db),
      // or we can manually insert 001 and 002.
      // Let's manually insert 001 and 002 if the table was just created.
      
      // Actually, since we only have 001, 002, 003, let's just do:
      try {
        await pool.query(sql);
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('duplicate key')) {
          console.log(`  ⚠️ ${file} already applied (caught schema error). Marking as applied.`);
        } else {
          throw err;
        }
      }

      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
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
