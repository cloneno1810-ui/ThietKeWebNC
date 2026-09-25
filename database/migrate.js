const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

function splitSqlCommands(sqlText) {
  const cleanSql = sqlText.replace(/--.*$/gm, '').trim();
  return cleanSql
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0);
}

async function runFile(filename) {
  console.log(`Running ${filename}...`);
  const content = fs.readFileSync(path.join(__dirname, filename), 'utf8');
  const commands = splitSqlCommands(content);
  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    try {
      await db.query(cmd);
    } catch (err) {
      console.error(`Error executing in ${filename} at command ${i + 1}:`, cmd.substring(0, 80));
      throw err;
    }
  }
  console.log(`Successfully completed ${filename} (${commands.length} statements).`);
}

async function main() {
  await runFile('schema.sql');
  await runFile('seed.sql');
  
  const userCount = await db.query('SELECT count(*) as total_users FROM users;');
  console.log('Total users seeded:', userCount.rows[0].total_users);
  
  const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
  console.log('Tables in database:', tables.rows.map(r => r.table_name));
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });
