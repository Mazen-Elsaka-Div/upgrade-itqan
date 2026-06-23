const { Project, SyntaxKind, Node } = require('ts-morph');
const fs = require('fs');

async function run() {
  const translations = JSON.parse(fs.readFileSync('translations.json', 'utf8'));
  const project = new Project();
  
  // 1. Update ar.ts and en.ts
  const arFile = project.addSourceFileAtPath('d:/Workspace/Itqan Upgrade/lib/i18n/locales/ar.ts');
  const enFile = project.addSourceFileAtPath('d:/Workspace/Itqan Upgrade/lib/i18n/locales/en.ts');
  
  function addTranslationsToLocale(file, isAr) {
    const exportAssignment = file.getExportAssignment(d => !d.isExportEquals());
    if (exportAssignment) {
      const obj = exportAssignment.getExpression();
      if (Node.isObjectLiteralExpression(obj)) {
        let extractedProp = obj.getProperty('extracted_2026_v2');
        if (!extractedProp) {
          extractedProp = obj.addPropertyAssignment({
            name: 'extracted_2026_v2',
            initializer: '{}'
          });
        }
        const extractedObj = extractedProp.getInitializer();
        if (Node.isObjectLiteralExpression(extractedObj)) {
          for (const [arStr, enStr] of Object.entries(translations)) {
            // Check if property exists
            const safeKey = JSON.stringify(arStr);
            if (!extractedObj.getProperty(p => p.getName() === arStr || p.getName() === safeKey)) {
              extractedObj.addPropertyAssignment({
                name: safeKey,
                initializer: JSON.stringify(isAr ? arStr : enStr)
              });
            }
          }
        }
      }
    }
  }
  
  addTranslationsToLocale(arFile, true);
  addTranslationsToLocale(enFile, false);
  arFile.saveSync();
  enFile.saveSync();
  console.log("Updated locales!");

  // 2. Modify the 26 files
  const files = [
    "components/video/video-settings-page.tsx",
    "components/video/video-session-detail.tsx",
    "components/video/halaqa-video-room.tsx",
    "components/reader/recordings-panel.tsx",
    "components/notifications-page.tsx",
    "components/halaqat/student-halaqa-detail.tsx",
    "components/halaqat/halaqa-detail.tsx",
    "components/halaqat/halaqa-sessions.tsx",
    "components/halaqat/halaqat-list.tsx",
    "components/academy/teacher/sessions-hub.tsx",
    "components/academy/audio-recorder.tsx",
    "components/academy/file-uploader.tsx",
    "components/academy/fiqh-form-settings-modal.tsx",
    "components/academy/send-meeting-link-modal.tsx",
    "components/academy/public-lesson-form.tsx",
    "components/academy/certificate-editor/template-editor.tsx",
    "lib/parent-weekly-report.ts",
    "lib/academy/parent-reports.ts",
    "lib/academy/gamification.ts",
    "lib/academy/competitions.ts",
    "lib/academy/points.ts",
    "app/reader/sessions/[id]/page.tsx",
    "app/reader/students/[id]/page.tsx",
    "app/academy/public/session/[token]/page.tsx",
    "app/academy/public/session/[token]/live/page.tsx",
    "app/academy/public/lesson/[lessonId]/page.tsx",
    "app/reader/page.tsx",
    "app/academy/parent/children/[id]/page.tsx"
  ];

  for (const file of files) {
    project.addSourceFileAtPath('d:/Workspace/Itqan Upgrade/' + file);
  }

  const isArabic = (str) => /[\u0600-\u06FF]/.test(str);

  for (const file of files) {
    const sourceFile = project.getSourceFile('d:/Workspace/Itqan Upgrade/' + file);
    if (!sourceFile) continue;

    let modified = false;

    // Helper to get replacement string
    const getReplacement = (text) => `(t.extracted_2026_v2?.[${JSON.stringify(text)}] || ${JSON.stringify(text)})`;

    // 1. Find conditional expressions: isAr ? 'ar' : 'en'
    const conditionalReplacements = [];
    sourceFile.forEachDescendant(node => {
      if (Node.isConditionalExpression(node)) {
        const condition = node.getCondition().getText();
        if (condition.includes('isAr') || condition.includes('locale === "ar"') || condition.includes("locale === 'ar'")) {
          const whenTrue = node.getWhenTrue();
          if (Node.isStringLiteral(whenTrue)) {
            const arStr = whenTrue.getLiteralValue();
            if (isArabic(arStr)) {
              conditionalReplacements.push({ node, text: arStr });
            }
          }
        }
      }
    });

    conditionalReplacements.forEach(({ node, text }) => {
      node.replaceWithText(getReplacement(text));
      modified = true;
    });

    // 2. Find String Literals
    const literalReplacements = [];
    sourceFile.forEachDescendant(node => {
      if (Node.isStringLiteral(node)) {
        const parent = node.getParent();
        if (Node.isImportDeclaration(parent) || Node.isPropertyAssignment(parent) && parent.getName() === 'className') return;
        const text = node.getLiteralValue();
        if (isArabic(text)) {
          if (Node.isJsxAttribute(parent)) {
             literalReplacements.push({ node, replacement: `{${getReplacement(text)}}` });
          } else {
             literalReplacements.push({ node, replacement: getReplacement(text) });
          }
        }
      } else if (Node.isJsxText(node)) {
        const text = node.getText().replace(/&nbsp;/g, ' ');
        if (isArabic(text)) {
           const trimmed = text.trim();
           if (trimmed) {
              literalReplacements.push({ node, replacement: `{${getReplacement(trimmed)}}` });
           }
        }
      } else if (Node.isNoSubstitutionTemplateLiteral(node)) {
        const text = node.getLiteralText();
        if (isArabic(text)) {
           literalReplacements.push({ node, replacement: getReplacement(text) });
        }
      }
    });

    // Sort in reverse order of position to avoid invalidating positions
    literalReplacements.sort((a, b) => b.node.getPos() - a.node.getPos());
    
    literalReplacements.forEach(({ node, replacement }) => {
      try { node.replaceWithText(replacement); modified = true; } catch (e) {}
    });

    if (modified) {
      sourceFile.saveSync();
      console.log(`Updated ${file}`);
    }
  }
}

run();
