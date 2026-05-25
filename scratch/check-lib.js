require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'library_books'").then(res => {
  console.log('library_books:', res.rows);
  return pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'library_categories'");
}).then(res => {
  console.log('library_categories:', res.rows);
  pool.end();
}).catch(err => {
  console.error(err);
  pool.end();
});
