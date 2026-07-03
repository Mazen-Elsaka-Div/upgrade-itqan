import pg from 'pg'
const { Client } = pg
const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } })
await c.connect()
const res = await c.query("SELECT setting_value FROM system_settings WHERE setting_key='homepage_hero_title'")
const cur = res.rows[0]?.setting_value
const next = cur && typeof cur === 'object' ? { ...cur, ar: 'إتقــــــانُ التلاوة' } : 'إتقــــــانُ التلاوة'
await c.query("UPDATE system_settings SET setting_value=$1 WHERE setting_key='homepage_hero_title'", [JSON.stringify(next)])
const after = await c.query("SELECT setting_value FROM system_settings WHERE setting_key='homepage_hero_title'")
console.log('AFTER:', JSON.stringify(after.rows[0]))
await c.end()
