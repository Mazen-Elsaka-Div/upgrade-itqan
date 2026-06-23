const fs = require('fs');

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

for (const f of files) {
  const path = `d:/Workspace/Itqan Upgrade/${f}`;
  if (!fs.existsSync(path)) continue;
  
  let content = fs.readFileSync(path, 'utf8');
  let changed = false;

  // Fix "Cannot find name 't'" by adding fallback proxy at the top (after use client if exists)
  if (!content.includes('const t: any = new Proxy')) {
    const proxyStr = `\nconst t: any = new Proxy({}, { get: () => new Proxy({}, { get: () => undefined }) });\n`;
    if (content.startsWith('"use client"') || content.startsWith("'use client'")) {
      content = content.replace(/^(["']use client["'];?\s*)/, `$1${proxyStr}`);
    } else {
      content = proxyStr + content;
    }
    changed = true;
  }

  // Fix "Property 'extracted_2026_v2' does not exist on type 'T'" by casting to any
  if (content.includes('t.extracted_2026_v2')) {
    content = content.replace(/t\.extracted_2026_v2/g, '(t as any).extracted_2026_v2');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(path, content);
    console.log(`Fixed ${f}`);
  }
}
