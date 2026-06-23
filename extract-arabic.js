const { Project, SyntaxKind, Node } = require('ts-morph');
const fs = require('fs');

const project = new Project();
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

const extractedStrings = new Set();

for (const file of files) {
  const sourceFile = project.getSourceFile('d:/Workspace/Itqan Upgrade/' + file);
  if (!sourceFile) continue;

  sourceFile.forEachDescendant(node => {
    if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
      const text = node.getLiteralText();
      if (isArabic(text)) {
        extractedStrings.add(text.trim());
      }
    } else if (Node.isJsxText(node)) {
      const text = node.getText().replace(/&nbsp;/g, ' ');
      if (isArabic(text)) {
        extractedStrings.add(text.trim());
      }
    } else if (Node.isTemplateMiddle(node) || Node.isTemplateHead(node) || Node.isTemplateTail(node)) {
      const text = node.getLiteralText();
      if (isArabic(text)) {
        extractedStrings.add(text.trim());
      }
    }
  });
}

console.log("Total unique Arabic strings found:", extractedStrings.size);
fs.writeFileSync('extracted_arabic.json', JSON.stringify(Array.from(extractedStrings), null, 2));
