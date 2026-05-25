const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'app', 'admin', 'library');
const destDir = path.join(__dirname, '..', 'app', 'academy', 'admin', 'library');

function copyAndReplace(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(file => {
      copyAndReplace(path.join(src, file), path.join(dest, file));
    });
  } else {
    let content = fs.readFileSync(src, 'utf8');
    
    // Replace API endpoint calls
    content = content.replace(/\/api\/admin\/library/g, "/api/academy/admin/library");
    // Replace Link hrefs or redirects pointing to /admin/library
    content = content.replace(/\/admin\/library/g, "/academy/admin/library");

    fs.writeFileSync(dest, content);
  }
}

copyAndReplace(srcDir, destDir);
console.log("Duplicated frontend routes!");
