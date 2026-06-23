const fs = require('fs');

const files = [
    'lib/parent-weekly-report.ts',
    'lib/academy/parent-reports.ts',
    'lib/academy/competitions.ts',
    'lib/academy/points.ts'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        const lines = fs.readFileSync(file, 'utf8').split('\n');
        let found = false;
        lines.forEach((line, index) => {
            if (/[\u0600-\u06FF]/.test(line)) {
                console.log(`${file}:${index + 1}: ${line.trim()}`);
                found = true;
            }
        });
        if (!found) {
            console.log(`${file} has NO Arabic characters!`);
        }
    } else {
        console.log(`${file} not found!`);
    }
}
