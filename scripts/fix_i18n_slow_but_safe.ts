import { Project, SyntaxKind } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

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

  let hasMoreReplacements = true;
  let fileWasModified = false;

  while (hasMoreReplacements) {
    hasMoreReplacements = false;
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(fullPath);
    let astModified = false;

    // 1. Ternaries
    const conditionals = sourceFile.getDescendantsOfKind(SyntaxKind.ConditionalExpression);
    for (const cond of conditionals) {
      if (astModified) break;
      const condText = cond.getCondition().getText();
      if (condText.includes('locale === "ar"') || condText.includes("locale === 'ar'") || condText.includes('isAr')) {
        const whenTrue = cond.getWhenTrue();
        if (whenTrue.isKind(SyntaxKind.StringLiteral) || whenTrue.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
          const textValue = whenTrue.getText().replace(/^["'`]|["'`]$/g, "");
          if (ARABIC_REGEX.test(textValue)) {
            const safeStr = textValue.replace(/'/g, "\\'");
            cond.replaceWithText(`(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`);
            astModified = true;
          }
        }
      }
    }

    if (!astModified) {
      // 2. String Literals
      const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
      for (const literal of stringLiterals) {
        if (astModified) break;
        const parent = literal.getParent();
        if (parent && (parent.isKind(SyntaxKind.ImportDeclaration) || parent.isKind(SyntaxKind.ImportSpecifier))) continue;
        if (parent && parent.getText().includes('addedTranslations_2026')) continue;

        const text = literal.getLiteralValue();
        if (ARABIC_REGEX.test(text)) {
          const safeStr = text.replace(/'/g, "\\'");
          if (parent.isKind(SyntaxKind.JsxAttribute)) {
            literal.replaceWithText(`{t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}'}`);
          } else {
            literal.replaceWithText(`(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`);
          }
          astModified = true;
        }
      }
    }

    if (!astModified) {
      // 3. JSX Text
      const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
      for (const jsxText of jsxTexts) {
        if (astModified) break;
        const text = jsxText.getText();
        if (ARABIC_REGEX.test(text)) {
          const match = text.match(/^([ \t\r\n]*)([\s\S]*?)([ \t\r\n]*)$/);
          if (match) {
            const leading = match[1];
            const core = match[2];
            const trailing = match[3];
            if (ARABIC_REGEX.test(core)) {
              // Avoid if it's already wrapped
              if (core.includes('addedTranslations_2026')) continue;
              const cleanCore = core.replace(/\n\s+/g, ' ').replace(/'/g, "\\'");
              jsxText.replaceWithText(`${leading}{(t.addedTranslations_2026?.['${cleanCore}'] || '${cleanCore}')}${trailing}`);
              astModified = true;
            }
          }
        }
      }
    }

    if (astModified) {
      sourceFile.saveSync();
      hasMoreReplacements = true;
      fileWasModified = true;
    }
  }

  if (fileWasModified) {
    // Add useI18n imports if needed
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    if (!content.includes('useI18n')) {
      content = `import { useI18n } from '@/lib/i18n/context';\n` + content;
      changed = true;
    }
    if (!content.includes('const { t } = useI18n()') && !content.includes('const { t,') && !content.includes(', t } = useI18n()')) {
      content = content.replace(/(export default function\s+\w+\s*\([^)]*\)\s*\{)/, "$1\n  const { t } = useI18n();\n");
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(fullPath, content, 'utf8');
    }
    console.log(`Successfully fixed (slow AST): ${filePath}`);
  }
}
