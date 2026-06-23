const fs = require('fs');

const oldTranslations = JSON.parse(fs.readFileSync('translations_en.json', 'utf8'));
const remaining = JSON.parse(fs.readFileSync('translations_remaining.json', 'utf8'));

const filtered = {};
let count = 0;
for (const key of Object.keys(remaining)) {
  if (!oldTranslations[key]) {
    filtered[key] = key;
    count++;
  }
}

fs.writeFileSync('translations_to_translate.json', JSON.stringify(filtered, null, 2));
console.log(`Filtered down to ${count} genuinely NEW strings!`);
