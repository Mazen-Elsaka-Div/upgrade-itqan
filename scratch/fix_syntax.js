const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'app', 'academy', 'library', '[id]', 'page.tsx');
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/``\/api\/library\/books\/\$\{id\}\?domain=academy``/g, '`/api/library/books/${id}?domain=academy`');
  fs.writeFileSync(file, content);
  console.log("Fixed syntax error");
}
