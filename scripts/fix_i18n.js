const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '../app');

const filesToFix = [
  // CRITICAL
  { path: 'academy/student/path/[id]/page.tsx', type: 'critical' },
  { path: 'academy/student/tasks/[id]/submit/page.tsx', type: 'critical' },
  { path: 'academy/student/path/[id]/stage/[stageId]/page.tsx', type: 'critical' },
  { path: 'academy/student/competitions/[id]/page.tsx', type: 'critical' },
  { path: 'academy/student/courses/[id]/page.tsx', type: 'critical' },
  { path: 'academy/student/courses/[id]/lesson/[lessonId]/page.tsx', type: 'critical' },
  { path: 'academy/student/series/[id]/page.tsx', type: 'critical' },
  { path: 'academy/student/sessions/[id]/live/page.tsx', type: 'critical' },
  { path: 'academy/student/halaqat/[id]/live/page.tsx', type: 'critical' },

  // MODERATE
  { path: 'student/page.tsx', type: 'moderate' },
  { path: 'student/mushaf/page.tsx', type: 'moderate' },
  { path: 'student/profile/page.tsx', type: 'moderate' },
  { path: 'student/chat/page.tsx', type: 'moderate' },
  { path: 'student/tajweed-paths/page.tsx', type: 'moderate' },
  { path: 'student/memorization-paths/page.tsx', type: 'moderate' },
  { path: 'student/recitations/page.tsx', type: 'moderate' },
  { path: 'student/wird/page.tsx', type: 'moderate' },
  { path: 'academy/student/page.tsx', type: 'moderate' },
  { path: 'academy/student/sessions/page.tsx', type: 'moderate' },
  { path: 'academy/student/calendar/page.tsx', type: 'moderate' }
];

function processCritical(content) {
  // 1. Ensure useI18n is imported
  if (!content.includes('useI18n')) {
    // Add import after "use client" if it exists
    const importStmt = "import { useI18n } from '@/lib/i18n/context';\n";
    if (content.includes('"use client"') || content.includes("'use client'")) {
      content = content.replace(/['"]use client['"];?\n?/, match => match + "\n" + importStmt);
    } else {
      content = importStmt + content;
    }
  }

  // 2. Ensure const { t } = useI18n() is inside the main component
  // This is tricky without AST. We can look for `export default function`
  if (!content.includes('useI18n()')) {
    content = content.replace(/(export default function \w+\([^)]*\)\s*\{)/, match => {
      return match + "\n  const { t } = useI18n();\n";
    });
  }

  // 3. Replace Arabic strings.
  // We'll replace all literal Arabic strings in quotes: 'عربي' => (t.addedTranslations_2026?.['عربي'] || 'عربي')
  // And JSX Text: >عربي< => >{(t.addedTranslations_2026?.['عربي'] || 'عربي')}<
  
  // Replace attributes: attr="عربي" => attr={t.addedTranslations_2026?.["عربي"] || "عربي"}
  content = content.replace(/([a-zA-Z0-9_]+)="([^"]*[\u0600-\u06FF]+[^"]*)"/g, (match, p1, p2) => {
    // Escape single quotes inside p2 just in case
    const safeStr = p2.replace(/'/g, "\\'");
    return `${p1}={t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}'}`;
  });

  // Replace JSX text: > عربي <
  content = content.replace(/>([^<]*[\u0600-\u06FF]+[^<]*)</g, (match, p1) => {
    // We only replace if the text contains Arabic. We should trim it to avoid huge whitespace replacements,
    // but React trims automatically mostly. Let's just wrap it.
    const text = p1.trim();
    if (!text) return match;
    const safeStr = text.replace(/'/g, "\\'");
    // Reconstruct the text with whitespace preserved
    return match.replace(text, `{(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')}`);
  });

  // Replace Javascript strings: 'عربي' or "عربي" (not preceded by =)
  // Regex to find quotes containing Arabic characters
  content = content.replace(/([^a-zA-Z0-9_])(['"])([^'"]*[\u0600-\u06FF]+[^'"]*)\2/g, (match, p1, p2, p3) => {
    // Avoid replacing inside our own injected string (t.addedTranslations_2026)
    if (match.includes('addedTranslations_2026')) return match;
    const safeStr = p3.replace(/'/g, "\\'");
    return `${p1}(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`;
  });

  // Fix template literals with Arabic
  content = content.replace(/([^a-zA-Z0-9_])`([^`]*[\u0600-\u06FF]+[^`]*)`/g, (match, p1, p2) => {
    if (match.includes('addedTranslations_2026')) return match;
    if (p2.includes('${')) {
      // If it contains interpolation, it's safer to just wrap the whole thing or leave it alone.
      // But we can just use `t.addedTranslations_2026?.[... ] || ...` 
      return `${p1}(t.addedTranslations_2026?.[\`${p2}\`] || \`${p2}\`)`;
    }
    const safeStr = p2.replace(/'/g, "\\'");
    return `${p1}(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`;
  });

  return content;
}

function processModerate(content) {
  // Replace `locale === "ar" ? "Arabic" : "English"` with `(t.addedTranslations_2026?.["Arabic"] || "Arabic")`
  content = content.replace(/locale\s*===\s*['"]ar['"]\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g, (match, p1, p2) => {
    const safeStr = p1.replace(/'/g, "\\'");
    return `(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`;
  });

  // Also catch template literals: locale === "ar" ? `...` : `...`
  content = content.replace(/locale\s*===\s*['"]ar['"]\s*\?\s*`([^`]+)`\s*:\s*`([^`]+)`/g, (match, p1, p2) => {
    if (p1.includes('${')) {
      return `(t.addedTranslations_2026?.[\`${p1}\`] || \`${p1}\`)`;
    }
    const safeStr = p1.replace(/'/g, "\\'");
    return `(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`;
  });

  // For `student/recitations/page.tsx` line 142: bare "عرض الكل"
  // For `student/wird/page.tsx`: buildItem stores Arabic
  // We'll run the JSX/string replacement for Arabic on moderate files too just in case!
  // But wait, they might have `t.something` already.
  // Actually, let's just do the `locale === 'ar'` replacement first, 
  // and then also catch remaining bare Arabic strings.
  
  // Replace attributes: attr="عربي" => attr={t.addedTranslations_2026?.["عربي"] || "عربي"}
  content = content.replace(/([a-zA-Z0-9_]+)="([^"]*[\u0600-\u06FF]+[^"]*)"/g, (match, p1, p2) => {
    if (match.includes('addedTranslations_2026')) return match;
    const safeStr = p2.replace(/'/g, "\\'");
    return `${p1}={t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}'}`;
  });

  // Replace JSX text: > عربي <
  content = content.replace(/>([^<]*[\u0600-\u06FF]+[^<]*)</g, (match, p1) => {
    const text = p1.trim();
    if (!text) return match;
    if (text.includes('addedTranslations_2026') || text.includes('t.')) return match; // skip if already translated
    const safeStr = text.replace(/'/g, "\\'");
    return match.replace(text, `{(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')}`);
  });

  // Javascript strings:
  content = content.replace(/([^a-zA-Z0-9_])(['"])([^'"]*[\u0600-\u06FF]+[^'"]*)\2/g, (match, p1, p2, p3) => {
    if (match.includes('addedTranslations_2026') || p3.includes('t.')) return match;
    const safeStr = p3.replace(/'/g, "\\'");
    return `${p1}(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`;
  });

  return content;
}

for (const file of filesToFix) {
  const fullPath = path.join(basePath, file.path);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  if (file.type === 'critical') {
    content = processCritical(content);
  } else {
    content = processModerate(content);
  }

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${file.path}`);
  } else {
    console.log(`No changes needed: ${file.path}`);
  }
}
