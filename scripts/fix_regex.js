const fs = require('fs');
const path = require('path');

const basePath = path.join(process.cwd(), 'app');
const filesToFix = [
  'academy/teacher/courses/[id]/page.tsx',
  'academy/teacher/paths/[id]/page.tsx',
  'academy/teacher/students/[id]/page.tsx',
  'academy/teacher/tasks/[id]/edit/page.tsx',
  'academy/teacher/sessions/[id]/page.tsx',
  'academy/teacher/competitions/[id]/page.tsx',
  'academy/teacher/tasks/[id]/grade/page.tsx',
  'reader/learning-paths/[id]/page.tsx',
  'academy/teacher/paths/page.tsx',
  'academy/teacher/courses/page.tsx',
  'academy/teacher/tasks/new/page.tsx',
  'reader/sessions/page.tsx',
  'reader/learning-paths/page.tsx',
  '(public)/sitemap-page/page.tsx',
  'academy/supervisor/teachers/page.tsx',
  'reader/certificates/page.tsx',
  'academy/teacher/courses/new/page.tsx',
  'academy/teacher/courses/[id]/lessons/page.tsx',
  'academy/teacher/chat/page.tsx',
  'academy/teacher/profile/page.tsx',
  'admin/users/[id]/page.tsx',
  'admin/email-templates/page.tsx',
  'reader/schedule/page.tsx',
  'reader/memorization-paths/page.tsx',
  'academy/fiqh-supervisor/messages/page.tsx',
  'admin/reader-applications/page.tsx',
  'admin/supervisors/page.tsx',
  'reader/students/[id]/page.tsx',
  'reader/sessions/[id]/page.tsx',
  'library/page.tsx',
  'library/[id]/page.tsx',
  'academy/teacher/sessions/[id]/live/page.tsx',
  'academy/teacher/halaqat/[id]/live/page.tsx',
  'academy/teacher/public-lessons/[id]/page.tsx',
  'academy/teacher/public-lessons/new/page.tsx',
  'academy/admin/halaqat/[id]/live/page.tsx',
  'academy/supervisor/fiqh/[id]/page.tsx',
  'academy/supervisor/content/[id]/page.tsx',
  'academy/admin/students/page.tsx',
  'reader/profile/page.tsx',
  'reader/chat/page.tsx',
  'reader/competitions/[id]/page.tsx',
  'reader/sessions/[id]/live/page.tsx',
  'reader/halaqat/[id]/live/page.tsx',
  'academy/fiqh-supervisor/questions/[id]/page.tsx',
  '(public)/contact/page.tsx',
  '(public)/page.tsx',
  'admin/users/page.tsx',
  'admin/reports/page.tsx',
  'admin/audit-log/page.tsx',
  'admin/halaqat/[id]/live/page.tsx'
];

const ARABIC_REGEX = /[\u0600-\u06FF]/;

for (const filePath of filesToFix) {
  const fullPath = path.join(basePath, filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${fullPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;

  // 1. Replace inline ternaries like: isAr ? 'عربي' : 'إنجليزي'
  // Regex matches: (isAr|locale === 'ar'|locale === "ar") \? (['"`])(.*?)['"`] : ['"`].*?['"`]
  content = content.replace(/(?:isAr|locale\s*===\s*['"]ar['"])\s*\?\s*(['"`])(.*?)\1\s*:\s*(['"`]).*?\3/g, (match, q1, arabicStr, q3) => {
    if (ARABIC_REGEX.test(arabicStr)) {
      const safeStr = arabicStr.replace(/'/g, "\\'");
      return `(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`;
    }
    return match;
  });

  // 2. Replace Arabic text inside JSX Text: >عربي<
  // We match > followed by spaces, arabic text, spaces, <
  // But doing it safely without breaking HTML tags
  content = content.replace(/>([^<>{}]*?[\u0600-\u06FF][^<>{}]*?)</g, (match, textContent) => {
    const trimmed = textContent.trim();
    if (!trimmed) return match;
    const safeStr = trimmed.replace(/\n\s+/g, ' ').replace(/'/g, "\\'");
    // Find the leading and trailing whitespace to preserve it
    const leadingMatch = textContent.match(/^\s*/);
    const trailingMatch = textContent.match(/\s*$/);
    const leading = leadingMatch ? leadingMatch[0] : '';
    const trailing = trailingMatch ? trailingMatch[0] : '';
    return `>${leading}{(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')}${trailing}<`;
  });

  // 3. Replace Arabic Strings in JSX attributes: placeholder="عربي"
  content = content.replace(/(\w+)=["']([^"']*?[\u0600-\u06FF][^"']*?)["']/g, (match, attrName, attrValue) => {
    // Avoid replacing dir="rtl" or something (although it doesn't have arabic)
    const safeStr = attrValue.replace(/'/g, "\\'");
    return `${attrName}={(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')}`;
  });

  // 4. Replace Arabic Strings in quotes: 'عربي' or "عربي"
  // Avoid replacing strings that are already inside our t.addedTranslations_2026
  content = content.replace(/(?<!addedTranslations_2026\?\.\s*\[\s*)(['"])([^'"]*?[\u0600-\u06FF][^'"]*?)\1/g, (match, quote, textValue) => {
    // Check if it's already wrapped
    const safeStr = textValue.replace(/'/g, "\\'");
    return `(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`;
  });

  // Check if modified
  if (content !== originalContent) {
    // Inject import and useI18n if not exists
    if (!content.includes('useI18n')) {
      content = `import { useI18n } from '@/lib/i18n/context';\n` + content;
    }
    
    // Attempt to inject `const { t } = useI18n();` inside the default export
    if (!content.includes('const { t } = useI18n()') && !content.includes('const { t,') && !content.includes(', t } = useI18n()')) {
      content = content.replace(/(export default function\s+\w+\s*\([^)]*\)\s*\{)/, "$1\n  const { t } = useI18n();\n");
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Successfully fixed: ${filePath}`);
  }
}
