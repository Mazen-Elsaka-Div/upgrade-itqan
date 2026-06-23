const fs = require('fs');

async function run() {
  const strings = JSON.parse(fs.readFileSync('extracted_arabic.json', 'utf8'));
  const translations = {};
  
  for (let i = 0; i < strings.length; i++) {
    translations[strings[i]] = strings[i]; // Just use Arabic for both, fixing the architecture first.
  }
  
  fs.writeFileSync('translations.json', JSON.stringify(translations, null, 2));
  console.log('Done!');
}

run();
