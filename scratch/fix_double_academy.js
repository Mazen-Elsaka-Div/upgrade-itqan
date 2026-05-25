const fs = require('fs');
const path = require('path');

function fixDoubleAcademy(dir) {
  if (fs.statSync(dir).isDirectory()) {
    fs.readdirSync(dir).forEach(file => {
      fixDoubleAcademy(path.join(dir, file));
    });
  } else {
    let content = fs.readFileSync(dir, 'utf8');
    let newContent = content.replace(/\/academy\/academy/g, "/academy");
    if (content !== newContent) {
      fs.writeFileSync(dir, newContent);
      console.log(`Fixed ${dir}`);
    }
  }
}

fixDoubleAcademy(path.join(__dirname, '..', 'app', 'academy', 'admin', 'library'));
console.log("Done fixing double academy");
