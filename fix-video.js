const fs = require('fs');
const file = `d:/Workspace/Itqan Upgrade/components/video/video-settings-page.tsx`;
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const t: any = new Proxy')) {
  content = `const t: any = new Proxy({}, { get: () => new Proxy({}, { get: () => undefined }) });\n${content}`;
}

content = content.replace(
  /export function VideoSettingsPage\(props: any\) \{\n\s*const \{ t \} = useI18n\(\);\n\s*platform, sessionsBasePath \}: Props\) \{/,
  `export function VideoSettingsPage({ platform, sessionsBasePath }: Props) {\n  const { t } = useI18n();`
);

fs.writeFileSync(file, content);
console.log('Fixed video-settings-page.tsx!');
