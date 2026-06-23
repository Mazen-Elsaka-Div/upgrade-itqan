const fs = require('fs');

const files = [
    'lib/parent-weekly-report.ts',
    'lib/academy/parent-reports.ts',
    'lib/academy/competitions.ts',
    'lib/academy/points.ts'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix imports
    content = content.replace(/import en from '@\/lib\/i18n\/locales\/en';?/g, "import { en } from '@/lib/i18n/locales/en';");
    content = content.replace(/import \{ en \} from '@\/lib\/i18n\/locales\/en';?/g, "import { en } from '@/lib/i18n/locales/en';"); // Ensure semicolon
    
    // Fix any
    content = content.replace(/en\.extracted_2026_v2/g, "(en.extracted_2026_v2 as any)");
    
    fs.writeFileSync(file, content);
    console.log(`Fixed any and imports in ${file}`);
}
