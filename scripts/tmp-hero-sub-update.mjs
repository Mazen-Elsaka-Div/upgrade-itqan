import pg from 'pg'
const { Client } = pg
const c = new Client({ connectionString: process.env.POSTGRES_URL_NON_POOLING, ssl: { rejectUnauthorized: false } })
await c.connect()
const r = await c.query("SELECT setting_value FROM system_settings WHERE setting_key='homepage_hero_subtitle'")
const val = r.rows[0].setting_value
const updated = { ...val, ar: 'ورحلةُ التَعَلُم' }
await c.query("UPDATE system_settings SET setting_value=$1 WHERE setting_key='homepage_hero_subtitle'", [JSON.stringify(updated)])
const after = await c.query("SELECT setting_value->>'ar' AS ar FROM system_settings WHERE setting_key='homepage_hero_subtitle'")
console.log('AFTER:', after.rows[0].ar)
await c.end()
