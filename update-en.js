const fs = require('fs');

const file = 'd:/Workspace/Itqan Upgrade/lib/i18n/locales/en.ts';
let content = fs.readFileSync(file, 'utf8');
const translations = JSON.parse(fs.readFileSync('translations_en.json', 'utf8'));

let extractedStr = 'extracted_2026_v2: {\n';
for (const [key, val] of Object.entries(translations)) {
  extractedStr += `    ${JSON.stringify(key)}: ${JSON.stringify(val)},\n`;
}
extractedStr += '  }';

// Since extracted_2026_v2 is the very last property in the object `en`
content = content.replace(/extracted_2026_v2:\s*\{[\s\S]*\}\s*\}\s*$/, extractedStr + '\n}\n');

fs.writeFileSync(file, content);
console.log('Updated en.ts');
