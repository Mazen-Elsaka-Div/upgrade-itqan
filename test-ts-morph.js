const { Project, SyntaxKind, Node } = require('ts-morph');
const fs = require('fs');

const project = new Project();
project.addSourceFileAtPath('d:/Workspace/Itqan Upgrade/components/academy/certificate-editor/template-editor.tsx');

const sourceFile = project.getSourceFile('d:/Workspace/Itqan Upgrade/components/academy/certificate-editor/template-editor.tsx');

const isArabic = (str) => /[\u0600-\u06FF]/.test(str);

let extracted = [];

sourceFile.forEachDescendant(node => {
  if (Node.isConditionalExpression(node)) {
    const condition = node.getCondition().getText();
    if (condition.includes('isAr') || condition.includes('locale === "ar"') || condition.includes("locale === 'ar'")) {
      const whenTrue = node.getWhenTrue();
      const whenFalse = node.getWhenFalse();
      if (Node.isStringLiteral(whenTrue) && Node.isStringLiteral(whenFalse)) {
        const arStr = whenTrue.getLiteralValue();
        const enStr = whenFalse.getLiteralValue();
        if (isArabic(arStr)) {
          extracted.push({ node, arStr, enStr });
        }
      }
    }
  }
});

extracted.forEach(({ node, arStr, enStr }) => {
  console.log(`Found: ${arStr} -> ${enStr}`);
  node.replaceWithText(`t.dynamic['${arStr}']`);
});

console.log('Modified code length:', sourceFile.getFullText().length);
