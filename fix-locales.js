const fs = require('fs');

const translations = JSON.parse(fs.readFileSync('translations.json', 'utf8'));

function updateLocale(file, isAr) {
  let content = fs.readFileSync(file, 'utf8');
  let extractedStr = ',\n  extracted_2026_v2: {\n';
  for (const [key, val] of Object.entries(translations)) {
    extractedStr += `    ${JSON.stringify(key)}: ${JSON.stringify(isAr ? key : val)},\n`;
  }
  extractedStr += '  }\n};';
  
  // Replace the final `};` with our new string
  // If it's `export default`, or `export const ar = {`, the last closing brace is `};` or `}`
  const lastBraceIndex = content.lastIndexOf('}');
  if (lastBraceIndex !== -1) {
    // If there is a semicolon after the brace
    const endStr = content.substring(lastBraceIndex);
    if (endStr.includes('};')) {
       content = content.substring(0, lastBraceIndex) + extractedStr;
    } else {
       content = content.substring(0, lastBraceIndex) + extractedStr.replace('};', '}');
    }
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}

updateLocale('d:/Workspace/Itqan Upgrade/lib/i18n/locales/ar.ts', true);
updateLocale('d:/Workspace/Itqan Upgrade/lib/i18n/locales/en.ts', false);
