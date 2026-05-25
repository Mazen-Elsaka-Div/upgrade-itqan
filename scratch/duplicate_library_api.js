const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'app', 'api', 'admin', 'library');
const destDir = path.join(__dirname, '..', 'app', 'api', 'academy', 'admin', 'library');

function copyAndReplace(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(file => {
      copyAndReplace(path.join(src, file), path.join(dest, file));
    });
  } else {
    let content = fs.readFileSync(src, 'utf8');
    
    // Replace admin role and maqraa domain
    content = content.replace(/const ADMIN_ROLES: (.*) = \["admin"\]/g, 'const ADMIN_ROLES: $1 = ["academy_admin"]');
    content = content.replace(/library_domain = 'maqraa'/g, "library_domain = 'academy'");
    content = content.replace(/'maqraa'/g, "'academy'");
    // specific to api/admin paths
    content = content.replace(/\[admin\/library/g, "[academy/admin/library");
    
    fs.writeFileSync(dest, content);
  }
}

copyAndReplace(srcDir, destDir);
console.log("Duplicated API routes!");
