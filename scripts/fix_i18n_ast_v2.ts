import { Project, SyntaxKind } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

const project = new Project();
const basePath = path.join(__dirname, '../app');

const filesToFix = [
  'student/recitations/[id]/page.tsx',
  'student/competitions/page.tsx',
  'academy/student/competitions/page.tsx',
  'academy/student/sessions/[id]/page.tsx',
  'academy/student/courses/archive/page.tsx'
];

const ARABIC_REGEX = /[\u0600-\u06FF]/;

for (const filePath of filesToFix) {
  const fullPath = path.join(basePath, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    continue;
  }

  const sourceFile = project.addSourceFileAtPath(fullPath);

  // 1. Moderate replacements: `isAr ? "Arabic" : "English"` or `locale === "ar" ? ...`
  const conditionals = sourceFile.getDescendantsOfKind(SyntaxKind.ConditionalExpression);
  for (const cond of conditionals) {
    const condition = cond.getCondition();
    const condText = condition.getText();
    
    if (condText.includes('locale === "ar"') || condText.includes("locale === 'ar'") || condText.includes('isAr')) {
      const whenTrue = cond.getWhenTrue();
      if (whenTrue.isKind(SyntaxKind.StringLiteral) || whenTrue.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
        const textValue = whenTrue.getText().replace(/^["'`]|["'`]$/g, "");
        
        // ONLY REPLACE IF IT CONTAINS ARABIC (ignores 'rtl', 'rotate-180', 'ar-SA', 'right-3' etc)
        if (ARABIC_REGEX.test(textValue)) {
          const safeStr = textValue.replace(/'/g, "\\'");
          cond.replaceWithText(`(t.addedTranslations_2026?.['${safeStr}'] || '${safeStr}')`);
        }
      }
    }
  }

  // 2. Common replacements for Arabic literal strings
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

  // 3. JSX Text
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
          const cleanCore = core.replace(/\n\s+/g, ' ').replace(/'/g, "\\'");
          jsxText.replaceWithText(`${leading}{(t.addedTranslations_2026?.['${cleanCore}'] || '${cleanCore}')}${trailing}`);
        }
      }
    }
  }

  sourceFile.saveSync();
  console.log(`Successfully fixed: ${filePath}`);
}
