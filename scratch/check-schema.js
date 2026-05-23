require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'tajweed_paths';
  `);
  console.log(res.rows);
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
