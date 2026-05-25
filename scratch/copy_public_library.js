const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'app', 'library');
const destDir = path.join(__dirname, '..', 'app', 'academy', 'library');

function copyAndReplace(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(file => {
      copyAndReplace(path.join(src, file), path.join(dest, file));
    });
  } else {
    let content = fs.readFileSync(src, 'utf8');
    
    // Replace API endpoints to include domain=academy
    content = content.replace(/\/api\/library\/categories/g, "/api/library/categories?domain=academy");
    content = content.replace(/params\.toString\(\)/g, 'params.toString() + "&domain=academy"');
    
    // In [id]/page.tsx
    content = content.replace(/\/api\/library\/books\/\$\{id\}/g, "`/api/library/books/${id}?domain=academy`");
    
    // Replace Links to books
    content = content.replace(/\/library\/\$\{b\.id\}/g, "/academy/library/${b.id}");
    content = content.replace(/href="\/library"/g, 'href="/academy/library"');
    
    // Update breadcrumb or back link
    content = content.replace(/'\/library'/g, "'/academy/library'");

    fs.writeFileSync(dest, content);
  }
}

copyAndReplace(srcDir, destDir);
console.log("Duplicated public library routes!");
