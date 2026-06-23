const fs = require('fs');

const files = [
    'lib/parent-weekly-report.ts',
    'lib/academy/parent-reports.ts',
    'lib/academy/competitions.ts',
    'lib/academy/points.ts'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/import en from '@\/lib\/i18n\/locales\/en'/g, "import { en } from '@/lib/i18n/locales/en'");
    content = content.replace(/import en from '@\/lib\/i18n\/locales\/en';/g, "import { en } from '@/lib/i18n/locales/en';");
    fs.writeFileSync(file, content);
    console.log(`Fixed import in ${file}`);
}

const enFile = 'd:/Workspace/Itqan Upgrade/lib/i18n/locales/en.ts';
let enContent = fs.readFileSync(enFile, 'utf8');

// The duplicate at 7594 and 7619. Let's just find and remove them.
let keys = new Set();
let lines = enContent.split('\n');
let modified = false;
for (let i=0; i<lines.length; i++) {
    let match = lines[i].match(/^\s*"((?:[^"\\]|\\.)*)":/);
    if (match) {
        if (keys.has(match[1])) {
            console.log(`Removed duplicate key on line ${i+1}: ${match[1]}`);
            lines[i] = "";
            modified = true;
        } else {
            keys.add(match[1]);
        }
    }
}

if (modified) {
    fs.writeFileSync(enFile, lines.filter(l => l !== "").join('\n'));
    console.log("Removed duplicates from en.ts");
}
