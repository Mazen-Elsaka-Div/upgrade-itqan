const fs = require('fs');
const path = require('path');

function replaceRoles(dir) {
  if (fs.statSync(dir).isDirectory()) {
    fs.readdirSync(dir).forEach(file => {
      replaceRoles(path.join(dir, file));
    });
  } else {
    let content = fs.readFileSync(dir, 'utf8');
    content = content.replace(/const ADMIN_ROLES: \("admin"\)\[\] = \["admin"\]/g, 'const ADMIN_ROLES: ("academy_admin")[] = ["academy_admin"]');
    content = content.replace(/const ADMIN_ROLES: AllRoles\[\] = \["admin"\]/g, 'const ADMIN_ROLES: AllRoles[] = ["academy_admin"]');
    fs.writeFileSync(dir, content);
  }
}

replaceRoles(path.join(__dirname, '..', 'app', 'api', 'academy', 'admin', 'library'));
console.log("Fixed roles!");
