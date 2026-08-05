const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'chat_messages';
    `);
    console.log("Columns in chat_messages:");
    res.rows.forEach(r => console.log("- " + r.column_name));
    
    // Also try adding it explicitly
    console.log("Adding attachment_id...");
    await pool.query(`
      ALTER TABLE chat_messages
      ADD COLUMN IF NOT EXISTS attachment_id UUID REFERENCES files(id) ON DELETE SET NULL;
    `);
    console.log("Added attachment_id!");
    
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}
main();
