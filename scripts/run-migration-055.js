const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  try {
    const sql = fs.readFileSync(path.join(__dirname, '055-path-stages-enhanced.sql'), 'utf8')
    console.log('Running migration 055: path stages enhanced...')
    await pool.query(sql)
    console.log('Done.')
  } catch (err) {
    console.error('Failed', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

run()
