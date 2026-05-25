require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS library_domain VARCHAR(50) NOT NULL DEFAULT 'maqraa';`);
    console.log("Added library_domain to books");
    
    await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS library_domain VARCHAR(50) NOT NULL DEFAULT 'maqraa';`);
    console.log("Added library_domain to categories");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
