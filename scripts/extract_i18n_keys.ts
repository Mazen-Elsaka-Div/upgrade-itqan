import * as fs from 'fs';
import * as path from 'path';

const appDir = path.resolve('./app');
const localesDir = path.resolve('./lib/i18n/locales');
const arFilePath = path.join(localesDir, 'ar.ts');
const enFilePath = path.join(localesDir, 'en.ts');

function getFiles(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      getFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.tsx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = getFiles(appDir);
const keys = new Set<string>();

const regex = /addedTranslations_2026\?\.\['([^']+)'\]/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }
}

console.log(`Found ${keys.size} translation keys.`);

function updateLocale(filePath: string, isEnglish: boolean) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find addedTranslations_2026 object
  const startMatch = content.match(/addedTranslations_2026:\s*\{/);
  if (!startMatch) {
    console.error(`Could not find addedTranslations_2026 in ${filePath}`);
    return;
  }
  
  const startIndex = startMatch.index! + startMatch[0].length;
  
  // Parse existing keys roughly
  let endMatchIndex = -1;
  let bracketCount = 1;
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') bracketCount++;
    if (content[i] === '}') bracketCount--;
    if (bracketCount === 0) {
      endMatchIndex = i;
      break;
    }
  }
  
  if (endMatchIndex === -1) {
    console.error(`Could not parse addedTranslations_2026 in ${filePath}`);
    return;
  }
  
  const existingContent = content.substring(startIndex, endMatchIndex);
  const existingKeys = new Set<string>();
  
  const keyRegex = /'([^']+)':/g;
  let keyMatch;
  while ((keyMatch = keyRegex.exec(existingContent)) !== null) {
    existingKeys.add(keyMatch[1]);
  }
  
  let newEntries = "";
  for (const key of keys) {
    if (!existingKeys.has(key)) {
      const escapedKey = key.replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
      if (isEnglish) {
        newEntries += `\n    '${escapedKey}': '${escapedKey}', // TODO: translate to English`;
      } else {
        newEntries += `\n    '${escapedKey}': '${escapedKey}',`;
      }
    }
  }
  
  if (newEntries.length > 0) {
    const updatedContent = content.slice(0, endMatchIndex) + newEntries + '\n  ' + content.slice(endMatchIndex);
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`No new keys to add for ${filePath}`);
  }
}

updateLocale(arFilePath, false);
updateLocale(enFilePath, true);
