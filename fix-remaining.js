const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const path = require('path');

const project = new Project({
    tsConfigFilePath: "tsconfig.json",
});

const filesToFix = [
    'lib/parent-weekly-report.ts',
    'lib/academy/parent-reports.ts',
    'lib/academy/gamification.ts',
    'lib/academy/competitions.ts',
    'lib/academy/points.ts',
    'app/academy/public/session/[token]/page.tsx',
    'app/academy/public/lesson/[lessonId]/page.tsx',
    'components/academy/audio-recorder.tsx',
    'components/academy/file-uploader.tsx',
    'components/academy/send-meeting-link-modal.tsx',
    'components/academy/public-lesson-form.tsx'
];

let addedStrings = new Set();
let localeMap = {};

try {
    const localeContent = fs.readFileSync('lib/i18n/locales/ar.ts', 'utf8');
    const match = localeContent.match(/extracted_2026_v2:\s*\{([\s\S]*?)\}\s*\}$/);
    if (match) {
        const lines = match[1].split('\n');
        for (const line of lines) {
            const kvMatch = line.match(/^\s*"((?:[^"\\]|\\.)*)":\s*"(.*?)"/);
            if (kvMatch) {
                let k = kvMatch[1].replace(/\\"/g, '"');
                localeMap[k] = kvMatch[2].replace(/\\"/g, '"');
            }
        }
    }
} catch(e) {}

console.log("Loaded " + Object.keys(localeMap).length + " existing keys.");

function hasArabic(text) {
    return /[\u0600-\u06FF]/.test(text);
}

function escapeString(str) {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

for (const filePath of filesToFix) {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
        console.log("File not found:", filePath);
        continue;
    }

    const sourceFile = project.addSourceFileAtPath(fullPath);
    let modified = false;

    // We only want to handle simple cases.
    // StringLiterals, NoSubstitutionTemplateLiteral, JsxText.

    sourceFile.forEachDescendant(node => {
        // StringLiteral (e.g. 'مرحبا')
        if (node.getKind() === SyntaxKind.StringLiteral) {
            const text = node.getLiteralText();
            if (hasArabic(text)) {
                // If it's already inside a property access or fallback we might skip it, but let's be careful.
                const parent = node.getParent();
                if (parent.getKind() === SyntaxKind.PropertyAssignment) {
                    if (parent.getNameNode() === node) return; // don't replace keys
                }
                if (parent.getKind() === SyntaxKind.ElementAccessExpression) return;
                
                const escaped = escapeString(text);
                const replacement = `((t as any).extracted_2026_v2?.["${escaped}"] || "${escaped}")`;
                
                addedStrings.add(text);
                node.replaceWithText(replacement);
                modified = true;
            }
        }
        
        // NoSubstitutionTemplateLiteral (e.g. `مرحبا`)
        else if (node.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral) {
            const text = node.getLiteralText();
            if (hasArabic(text)) {
                const escaped = escapeString(text);
                const replacement = `((t as any).extracted_2026_v2?.["${escaped}"] || "${escaped}")`;
                
                addedStrings.add(text);
                node.replaceWithText(replacement);
                modified = true;
            }
        }
        
        // JsxText
        else if (node.getKind() === SyntaxKind.JsxText) {
            const text = node.getLiteralText();
            if (hasArabic(text) && text.trim().length > 0) {
                const clean = text.replace(/\s+/g, ' ').trim();
                if (hasArabic(clean)) {
                    const escaped = escapeString(clean);
                    const replacement = `{((t as any).extracted_2026_v2?.["${escaped}"] || "${escaped}")}`;
                    addedStrings.add(clean);
                    node.replaceWithText(replacement);
                    modified = true;
                }
            }
        }
        
        // Template strings with expressions (e.g. `مرحبا ${name}`)
        // Handling these is complex, but we can do it by replacing the whole TemplateExpression.
        else if (node.getKind() === SyntaxKind.TemplateExpression) {
            const fullText = node.getText(); // e.g. `مرحبا ${name}`
            if (hasArabic(fullText)) {
                // Let's just try to replace the string parts if possible?
                // Actually, let's just log them for now so we know.
                console.log(`Found complex template in ${filePath}: ${fullText}`);
            }
        }
    });

    if (modified) {
        // Add Proxy if not exists
        let srcText = sourceFile.getFullText();
        if (!srcText.includes('const t: any = new Proxy')) {
            const lines = srcText.split('\n');
            let insertIdx = 0;
            if (lines[0].startsWith('"use client"') || lines[0].startsWith("'use client'")) {
                insertIdx = 1;
            }
            lines.splice(insertIdx, 0, '\nconst t: any = new Proxy({}, { get: () => new Proxy({}, { get: () => undefined }) });');
            sourceFile.replaceWithText(lines.join('\n'));
        }
        sourceFile.saveSync();
        console.log(`Fixed ${filePath}`);
    }
}

// Now add the new strings to `translations_remaining.json` so we can translate them!
const newTranslations = {};
let count = 0;
for (const str of addedStrings) {
    if (!localeMap[str]) {
        newTranslations[str] = str;
        count++;
    }
}

fs.writeFileSync('translations_remaining.json', JSON.stringify(newTranslations, null, 2));
console.log(`Found ${count} new strings to translate!`);
