const fs = require('fs');
const glob = require('glob'); // Assume we have to do it manually or with a simple regex
const path = require('path');

function findFiles(dir, fileList) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.git') && !filePath.includes('.next')) {
        findFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = findFiles('.', []);
let newStrings = new Set();
let existingKeys = new Set();

try {
  const enContent = fs.readFileSync('lib/i18n/locales/en.ts', 'utf8');
  const match = enContent.match(/extracted_2026_v2:\s*\{([\s\S]*?)\}\s*\}$/);
  if (match) {
    const lines = match[1].split('\n');
    for (const line of lines) {
      const kvMatch = line.match(/^\s*"((?:[^"\\]|\\.)*)":/);
      if (kvMatch) {
        existingKeys.add(kvMatch[1].replace(/\\"/g, '"'));
      }
    }
  }
} catch(e) {}

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Match `extracted_2026_v2?.["some string"]`
  const matches = content.matchAll(/extracted_2026_v2\?\.\["((?:[^"\\]|\\.)*)"\]/g);
  for (const match of matches) {
    const key = match[1].replace(/\\"/g, '"');
    if (!existingKeys.has(key)) {
      newStrings.add(key);
    }
  }
}

const toTranslate = {};
for (const str of newStrings) {
  toTranslate[str] = str;
}

fs.writeFileSync('translations_remaining.json', JSON.stringify(toTranslate, null, 2));
console.log(`Found ${Object.keys(toTranslate).length} new strings to translate.`);
