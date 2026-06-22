const fs = require('fs');
const path = require('path');

const basePath = path.join(process.cwd(), 'app');
const filesToFix = [
  'admin/email-templates/page.tsx',
  'admin/reader-applications/page.tsx',
  'admin/supervisors/page.tsx',
  'reader/competitions/[id]/page.tsx',
  'reader/learning-paths/[id]/page.tsx',
  'reader/sessions/[id]/page.tsx',
  'reader/students/[id]/page.tsx',
  'academy/fiqh-supervisor/questions/[id]/page.tsx',
  'academy/supervisor/content/[id]/page.tsx',
  'academy/supervisor/fiqh/[id]/page.tsx',
  'academy/teacher/courses/[id]/page.tsx',
  'academy/teacher/paths/page.tsx',
  'academy/teacher/profile/page.tsx'
];

const ARABIC_REGEX = /[\u0600-\u06FF]/;

for (const filePath of filesToFix) {
  const fullPath = path.join(basePath, filePath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;

  // 1. Replace inline ternaries like: isAr ? 'عربي' : 'إنجليزي'
  content = content.replace(/(?:isAr|locale\s*===\s*['"]ar['"])\s*\?\s*(['"`])(.*?)\1\s*:\s*(['"`]).*?\3/g, (match, q1, arabicStr, q3) => {
    if (ARABIC_REGEX.test(arabicStr)) {
      const safeStr = arabicStr.replace(/'/g, "\\'");
      return `(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`;
    }
    return match;
  });

  // 3. Replace Arabic Strings in JSX attributes: placeholder="عربي"
  content = content.replace(/(\w+)=["']([^"']*?[\u0600-\u06FF][^"']*?)["']/g, (match, attrName, attrValue) => {
    const safeStr = attrValue.replace(/'/g, "\\'");
    return `${attrName}={(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')}`;
  });

  // Check if modified
  if (content !== originalContent) {
    if (!content.includes('useI18n')) {
      content = `import { useI18n } from '@/lib/i18n/context';\n` + content;
    }
    
    if (!content.includes('const { t } = useI18n()') && !content.includes('const { t,') && !content.includes(', t } = useI18n()')) {
      content = content.replace(/(export default function\s+\w+\s*\([^)]*\)\s*\{)/, "$1\n  const { t } = useI18n();\n");
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Successfully fixed safe regex for: ${filePath}`);
  }
}
