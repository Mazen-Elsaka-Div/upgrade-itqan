const fs = require('fs');

const file = 'd:/Workspace/Itqan Upgrade/lib/i18n/locales/en.ts';
let content = fs.readFileSync(file, 'utf8');

const match = content.match(/extracted_2026_v2:\s*\{([\s\S]*?)\}\s*\}$/);
if (match) {
  const lines = match[1].split('\\n');
  const seen = new Set();
  const newLines = [];
  
  // Actually it's easier to just parse the last part, remove duplicates, and write it back.
  let objText = '{' + match[1] + '}';
  // But wait, it's not valid JSON.
}

