const fs = require('fs');

// 1. parent-weekly-report.ts
let p1 = fs.readFileSync('lib/parent-weekly-report.ts', 'utf8');

// Status Map
p1 = p1.replace(/pending: "قيد المراجعة",/, 'pending: (en.extracted_2026_v2 as any)?.["قيد المراجعة"] || "قيد المراجعة",');
p1 = p1.replace(/in_review: "قيد المراجعة",/, 'in_review: (en.extracted_2026_v2 as any)?.["قيد المراجعة"] || "قيد المراجعة",');
p1 = p1.replace(/mastered: "متقن",/, 'mastered: (en.extracted_2026_v2 as any)?.["متقن"] || "متقن",');
p1 = p1.replace(/needs_session: "بحاجة لجلسة",/, 'needs_session: (en.extracted_2026_v2 as any)?.["بحاجة لجلسة"] || "بحاجة لجلسة",');
p1 = p1.replace(/rejected: "مرفوض",/, 'rejected: (en.extracted_2026_v2 as any)?.["مرفوض"] || "مرفوض",');
p1 = p1.replace(/completed: "مكتمل",/, 'completed: (en.extracted_2026_v2 as any)?.["مكتمل"] || "مكتمل",');
p1 = p1.replace(/confirmed: "مؤكد",/, 'confirmed: (en.extracted_2026_v2 as any)?.["مؤكد"] || "مؤكد",');
p1 = p1.replace(/cancelled: "ملغي",/, 'cancelled: (en.extracted_2026_v2 as any)?.["ملغي"] || "ملغي",');

// HTML
p1 = p1.replace(/>📖 التلاوات<\/h3>/, '>${(en.extracted_2026_v2 as any)?.["📖 التلاوات"] || "📖 التلاوات"}</h3>');
p1 = p1.replace(/>لم يتم تقديم تلاوات هذا الأسبوع\./, '>${(en.extracted_2026_v2 as any)?.["لم يتم تقديم تلاوات هذا الأسبوع."] || "لم يتم تقديم تلاوات هذا الأسبوع."}');
p1 = p1.replace(/>🎙️ الجلسات<\/h3>/, '>${(en.extracted_2026_v2 as any)?.["🎙️ الجلسات"] || "🎙️ الجلسات"}</h3>');
p1 = p1.replace(/عرض التقرير الكامل في المنصة/, '${(en.extracted_2026_v2 as any)?.["عرض التقرير الكامل في المنصة"] || "عرض التقرير الكامل في المنصة"}');

fs.writeFileSync('lib/parent-weekly-report.ts', p1);

// 2. parent-reports.ts
let p2 = fs.readFileSync('lib/academy/parent-reports.ts', 'utf8');
p2 = p2.replace(/<h3>التلاوات<\/h3>/, '<h3>${(en.extracted_2026_v2 as any)?.["التلاوات"] || "التلاوات"}</h3>');
p2 = p2.replace(/<h3>الجلسات<\/h3>/, '<h3>${(en.extracted_2026_v2 as any)?.["الجلسات"] || "الجلسات"}</h3>');
fs.writeFileSync('lib/academy/parent-reports.ts', p2);

// 3. competitions.ts
let p3 = fs.readFileSync('lib/academy/competitions.ts', 'utf8');
p3 = p3.replace(/`الحد الأدنى للمشاركة هو \$\{minVerses\} آية`/, '`${(en.extracted_2026_v2 as any)?.["الحد الأدنى للمشاركة هو "] || "الحد الأدنى للمشاركة هو "}${minVerses}${(en.extracted_2026_v2 as any)?.[" آية"] || " آية"}`');
fs.writeFileSync('lib/academy/competitions.ts', p3);

// Inject missing translations into en.ts
let enContent = fs.readFileSync('lib/i18n/locales/en.ts', 'utf8');
const additions = {
    '📖 التلاوات': '📖 Recitations',
    'لم يتم تقديم تلاوات هذا الأسبوع.': 'No recitations submitted this week.',
    '🎙️ الجلسات': '🎙️ Sessions',
    'التلاوات': 'Recitations',
    'الجلسات': 'Sessions'
};
let addedStr = '';
for (const [ar, en] of Object.entries(additions)) {
    if (!enContent.includes(`"${ar}":`)) {
        addedStr += `    "${ar}": "${en}",\n`;
    }
}
if (addedStr !== '') {
    enContent = enContent.replace(/(\s*)\}\s*\}\s*$/, `,\n${addedStr}$1}\n}\n`);
    fs.writeFileSync('lib/i18n/locales/en.ts', enContent);
}

console.log('Fixed remaining direct Arabic lines!');
