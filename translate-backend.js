const fs = require('fs');

const files = [
    'lib/parent-weekly-report.ts',
    'lib/academy/parent-reports.ts',
    'lib/academy/competitions.ts',
    'lib/academy/points.ts'
];

let stringsToTranslate = [];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the Proxy with the import
    if (content.includes('const t: any = new Proxy')) {
        content = content.replace(/const t: any = new Proxy[^\n]*\n/, '');
    }
    if (!content.includes("import en from '@/lib/i18n/locales/en'")) {
        // Insert after imports or at top
        let lines = content.split('\n');
        let insertIdx = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import')) {
                insertIdx = i + 1;
            }
        }
        lines.splice(insertIdx, 0, "import en from '@/lib/i18n/locales/en';");
        content = lines.join('\n');
    }

    // Replace existing (t as any) with en
    content = content.replace(/\(\(t as any\)\.extracted_2026_v2/g, '(en.extracted_2026_v2');

    // Extract new strings
    let regex = /`([^`]*)`/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        if (/[\u0600-\u06FF]/.test(match[1])) {
            stringsToTranslate.push(match[1]);
        }
    }
    
    let regex2 = /'([^']*)'/g;
    while ((match = regex2.exec(content)) !== null) {
        if (/[\u0600-\u06FF]/.test(match[1])) {
            stringsToTranslate.push(match[1]);
        }
    }
    
    let regex3 = /"([^"]*)"/g;
    while ((match = regex3.exec(content)) !== null) {
        if (/[\u0600-\u06FF]/.test(match[1])) {
            stringsToTranslate.push(match[1]);
        }
    }
}

fs.writeFileSync('backend_strings.json', JSON.stringify([...new Set(stringsToTranslate)], null, 2));
console.log('Extracted backend strings to backend_strings.json');
