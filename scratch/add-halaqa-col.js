const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgresql://postgres.lrrhqjvgippgrlcozrvr:Sayed8820066@aws-1-eu-west-3.pooler.supabase.com:6543/postgres' }); 
client.connect().then(() => client.query("ALTER TABLE tajweed_path_stages ADD COLUMN IF NOT EXISTS halaqa_id UUID;")).then(res => { console.log('Added halaqa_id'); client.end(); }).catch(err => { console.error(err); client.end(); });
