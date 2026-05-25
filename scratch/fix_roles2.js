const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'app', 'api', 'academy', 'admin', 'library');
const files = [
  'books/route.ts',
  'books/[id]/route.ts',
  'books/[id]/files/route.ts',
  'books/[id]/files/[fileId]/route.ts',
  'categories/route.ts',
  'categories/[id]/route.ts'
];

files.forEach(f => {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/const ADMIN_ROLES: \("admin"\)\[\] = \["academy_admin"\]/g, 'const ADMIN_ROLES: ("academy_admin")[] = ["academy_admin"]');
  content = content.replace(/const ADMIN_ROLES: AllRoles\[\] = \["admin"\]/g, 'const ADMIN_ROLES: AllRoles[] = ["academy_admin"]');
  fs.writeFileSync(p, content);
});

console.log("Fixed manually!");
