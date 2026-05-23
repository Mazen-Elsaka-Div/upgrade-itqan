require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function check() {
  const res = await pool.query(`
    SELECT subject, count(*) 
    FROM tajweed_paths 
    GROUP BY subject;
  `);
  console.log(res.rows);
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
