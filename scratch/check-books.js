require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'books'").then(res => {
  console.log('books:', res.rows);
  return pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'categories'");
}).then(res => {
  console.log('categories:', res.rows);
  pool.end();
}).catch(err => {
  console.error(err);
  pool.end();
});
