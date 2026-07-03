import pg from 'pg'
const { Client } = pg
const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } })
await c.connect()
const r = await c.query("SELECT setting_value FROM system_settings WHERE setting_key='homepage_hero_subtitle'")
console.log(JSON.stringify(r.rows))
await c.end()
