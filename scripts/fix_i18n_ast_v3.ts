import { Project, SyntaxKind } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

const project = new Project();
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

  let modified = false;
  const sourceFile = project.addSourceFileAtPath(fullPath);

  let astModified = true;
  while (astModified) {
    astModified = false;
    
    const conditionals = sourceFile.getDescendantsOfKind(SyntaxKind.ConditionalExpression);
    for (const cond of conditionals) {
      const condition = cond.getCondition();
      const condText = condition.getText();
      
      if (condText.includes('locale === "ar"') || condText.includes("locale === 'ar'") || condText.includes('isAr')) {
        const whenTrue = cond.getWhenTrue();
        if (whenTrue.isKind(SyntaxKind.StringLiteral) || whenTrue.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
          const textValue = whenTrue.getText().replace(/^["'`]|["'`]$/g, "");
          
          if (ARABIC_REGEX.test(textValue)) {
            const safeStr = textValue.replace(/'/g, "\\'");
            cond.replaceWithText(`(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`);
            modified = true;
            astModified = true;
            break;
          }
        }
      }
    }
    if (astModified) continue;

    const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
    for (const literal of stringLiterals) {
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
        modified = true;
        astModified = true;
        break;
      }
    }
    if (astModified) continue;

    const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
    for (const jsxText of jsxTexts) {
      const text = jsxText.getText();
      if (ARABIC_REGEX.test(text)) {
        const match = text.match(/^([ \t\r\n]*)([\s\S]*?)([ \t\r\n]*)$/);
        if (match) {
          const leading = match[1];
          const core = match[2];
          const trailing = match[3];
          if (ARABIC_REGEX.test(core)) {
            const cleanCore = core.replace(/\n\s+/g, ' ').replace(/'/g, "\\'");
            jsxText.replaceWithText(`${leading}{(t.addedTranslations_2026?.['${cleanCore}'] || '${cleanCore}')}${trailing}`);
            modified = true;
            astModified = true;
            break;
          }
        }
      }
    }
  }

  if (modified) {
    // Add import and destructuring if needed
    let hasImport = false;
    for (const dec of sourceFile.getImportDeclarations()) {
      if (dec.getModuleSpecifierValue() === '@/lib/i18n/context' || dec.getModuleSpecifierValue().includes('/i18n/context')) {
        hasImport = true;
        break;
      }
    }

    if (!hasImport) {
      sourceFile.addImportDeclaration({
        namedImports: ['useI18n'],
        moduleSpecifier: '@/lib/i18n/context'
      });
    }

    // Try to find the default export function and add `const { t } = useI18n();` if not present
    const defaultExport = sourceFile.getDefaultExportSymbol();

    sourceFile.saveSync();
    console.log(`Successfully fixed: ${filePath}`);
    project.removeSourceFile(sourceFile);
  } else {
    project.removeSourceFile(sourceFile);
  }
}
