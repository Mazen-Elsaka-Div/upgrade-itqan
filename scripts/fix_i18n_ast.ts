import { Project, SyntaxKind, StringLiteral, JsxText, Node } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

const project = new Project();
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

const ARABIC_REGEX = /[\u0600-\u06FF]/;

for (const fileDef of filesToFix) {
  const fullPath = path.join(basePath, fileDef.path);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    continue;
  }

  const sourceFile = project.addSourceFileAtPath(fullPath);

  // Moderate replacements: `locale === "ar" ? "Arabic" : "English"`
  if (fileDef.type === 'moderate') {
    const conditionals = sourceFile.getDescendantsOfKind(SyntaxKind.ConditionalExpression);
    for (const cond of conditionals) {
      const condition = cond.getCondition();
      if (condition.getText().includes('locale === "ar"') || condition.getText().includes("locale === 'ar'")) {
        const whenTrue = cond.getWhenTrue();
        if (whenTrue.isKind(SyntaxKind.StringLiteral) || whenTrue.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
          const textValue = whenTrue.getText().replace(/^["'`]|["'`]$/g, "");
          const safeStr = textValue.replace(/'/g, "\\'");
          cond.replaceWithText(`(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`);
        }
      }
    }
  }

  // Common replacements for Arabic literal strings and JSX text
  const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  for (const literal of stringLiterals) {
    // Avoid replacing inside imports
    const parent = literal.getParent();
    if (parent && (parent.isKind(SyntaxKind.ImportDeclaration) || parent.isKind(SyntaxKind.ImportSpecifier))) continue;
    // Avoid already wrapped calls
    if (parent && parent.getText().includes('addedTranslations_2026')) continue;

    const text = literal.getLiteralValue();
    if (ARABIC_REGEX.test(text)) {
      const safeStr = text.replace(/'/g, "\\'");
      if (parent.isKind(SyntaxKind.JsxAttribute)) {
        literal.replaceWithText(`{t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}'}`);
      } else {
        literal.replaceWithText(`(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`);
      }
    }
  }

  // JSX Text
  const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  for (const jsxText of jsxTexts) {
    const text = jsxText.getText();
    if (ARABIC_REGEX.test(text)) {
      // Find leading and trailing whitespace to preserve it
      const match = text.match(/^([ \t\r\n]*)(.*?)([ \t\r\n]*)$/s);
      if (match) {
        const leading = match[1];
        const core = match[2];
        const trailing = match[3];
        if (ARABIC_REGEX.test(core)) {
          // Unescape JSX specific things if necessary or just use the literal text
          const cleanCore = core.replace(/\n\s+/g, ' ').replace(/'/g, "\\'");
          jsxText.replaceWithText(`${leading}{(t.addedTranslations_2026?.['${cleanCore}'] || '${cleanCore}')}${trailing}`);
        }
      }
    }
  }

  // Add imports and useI18n for critical files
  if (fileDef.type === 'critical') {
    let hasImport = false;
    for (const imp of sourceFile.getImportDeclarations()) {
      if (imp.getModuleSpecifierValue() === '@/lib/i18n/context') {
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

    const defaultExport = sourceFile.getDefaultExportSymbol()?.getDeclarations()[0];
    if (defaultExport && defaultExport.isKind(SyntaxKind.FunctionDeclaration)) {
      const body = defaultExport.getBody();
      if (body && body.isKind(SyntaxKind.Block)) {
        if (!body.getText().includes('useI18n()')) {
          body.insertStatements(0, "const { t } = useI18n();");
        }
      }
    }
  }

  sourceFile.saveSync();
  console.log(`Successfully fixed: ${fileDef.path}`);
}
