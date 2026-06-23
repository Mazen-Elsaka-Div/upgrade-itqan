const fs = require('fs');

function addImport(file) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes("import en from '@/lib/i18n/locales/en'")) {
        let lines = content.split('\n');
        let insertIdx = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import')) {
                insertIdx = i + 1;
            }
        }
        lines.splice(insertIdx, 0, "import en from '@/lib/i18n/locales/en'");
        content = lines.join('\n');
        fs.writeFileSync(file, content);
    }
}

// 1. parent-reports.ts
addImport('lib/academy/parent-reports.ts');
let p1 = fs.readFileSync('lib/academy/parent-reports.ts', 'utf8');
p1 = p1.replace(/"<li>لا توجد تلاوات هذا الأسبوع\.<\/li>"/g, 'en.extracted_2026_v2?.["<li>لا توجد تلاوات هذا الأسبوع.</li>"] || "<li>لا توجد تلاوات هذا الأسبوع.</li>"');
p1 = p1.replace(/"<li>لا توجد جلسات حضور مسجلة هذا الأسبوع\.<\/li>"/g, 'en.extracted_2026_v2?.["<li>لا توجد جلسات حضور مسجلة هذا الأسبوع.</li>"] || "<li>لا توجد جلسات حضور مسجلة هذا الأسبوع.</li>"');
p1 = p1.replace(/"<li>لا توجد شارات جديدة هذا الأسبوع\.<\/li>"/g, 'en.extracted_2026_v2?.["<li>لا توجد شارات جديدة هذا الأسبوع.</li>"] || "<li>لا توجد شارات جديدة هذا الأسبوع.</li>"');

p1 = p1.replace(/<h2 style="color:#0B3D2E;">تقرير \$\{report\.childName\} الأسبوعي<\/h2>/g, '<h2 style="color:#0B3D2E;">${en.extracted_2026_v2?.["تقرير "] || "تقرير "}${report.childName}${en.extracted_2026_v2?.[" الأسبوعي"] || " الأسبوعي"}</h2>');
p1 = p1.replace(/<p>السلام عليكم \$\{report\.parentName\}، هذا ملخص أداء \$\{report\.childName\} من \$\{report\.weekStart\} إلى \$\{report\.weekEnd\}\.<\/p>/g, '<p>${en.extracted_2026_v2?.["السلام عليكم "] || "السلام عليكم "}${report.parentName}${en.extracted_2026_v2?.["، هذا ملخص أداء "] || "، هذا ملخص أداء "}${report.childName}${en.extracted_2026_v2?.[" من "] || " من "}${report.weekStart}${en.extracted_2026_v2?.[" إلى "] || " إلى "}${report.weekEnd}.</p>');
p1 = p1.replace(/<strong>تلاوات الأسبوع<\/strong>/g, '<strong>${en.extracted_2026_v2?.["تلاوات الأسبوع"] || "تلاوات الأسبوع"}</strong>');
p1 = p1.replace(/<strong>جلسات حُضرت<\/strong>/g, '<strong>${en.extracted_2026_v2?.["جلسات حُضرت"] || "جلسات حُضرت"}</strong>');
p1 = p1.replace(/<strong>المستوى الحالي<\/strong>/g, '<strong>${en.extracted_2026_v2?.["المستوى الحالي"] || "المستوى الحالي"}</strong>');
p1 = p1.replace(/<strong>الشارات الجديدة<\/strong>/g, '<strong>${en.extracted_2026_v2?.["الشارات الجديدة"] || "الشارات الجديدة"}</strong>');
p1 = p1.replace(/<h3>التلاوات \(Recitations\)<\/h3>/g, '<h3>${en.extracted_2026_v2?.["التلاوات (Recitations)"] || "التلاوات (Recitations)"}</h3>');
p1 = p1.replace(/<h3>الجلسات \(Sessions\)<\/h3>/g, '<h3>${en.extracted_2026_v2?.["الجلسات (Sessions)"] || "الجلسات (Sessions)"}</h3>');
p1 = p1.replace(/<h3>الشارات<\/h3>/g, '<h3>${en.extracted_2026_v2?.["الشارات"] || "الشارات"}</h3>');

p1 = p1.replace(/`تقرير \$\{report\.childName\} الأسبوعي`/g, '`${en.extracted_2026_v2?.["تقرير "] || "تقرير "}${report.childName}${en.extracted_2026_v2?.[" الأسبوعي"] || " الأسبوعي"}`');
p1 = p1.replace(/`الفترة: \$\{report\.weekStart\} إلى \$\{report\.weekEnd\}`/g, '`${en.extracted_2026_v2?.["الفترة: "] || "الفترة: "}${report.weekStart}${en.extracted_2026_v2?.[" إلى "] || " إلى "}${report.weekEnd}`');
p1 = p1.replace(/`تلاوات الأسبوع: \$\{report\.recitationsCount\}`/g, '`${en.extracted_2026_v2?.["تلاوات الأسبوع: "] || "تلاوات الأسبوع: "}${report.recitationsCount}`');
p1 = p1.replace(/`جلسات حُضرت: \$\{report\.sessionsAttended\}`/g, '`${en.extracted_2026_v2?.["جلسات حُضرت: "] || "جلسات حُضرت: "}${report.sessionsAttended}`');
p1 = p1.replace(/`المستوى الحالي: \$\{report\.currentLevel\}`/g, '`${en.extracted_2026_v2?.["المستوى الحالي: "] || "المستوى الحالي: "}${report.currentLevel}`');
p1 = p1.replace(/`الشارات الجديدة: \$\{report\.badgesEarned\}`/g, '`${en.extracted_2026_v2?.["الشارات الجديدة: "] || "الشارات الجديدة: "}${report.badgesEarned}`');
p1 = p1.replace(/`تقرير \$\{report\.childName\} الأسبوعي - منصة إتقان`/g, '`${en.extracted_2026_v2?.["تقرير "] || "تقرير "}${report.childName} ${en.extracted_2026_v2?.["الأسبوعي - منصة إتقان"] || "الأسبوعي - منصة إتقان"}`');
fs.writeFileSync('lib/academy/parent-reports.ts', p1);

// 2. parent-weekly-report.ts
addImport('lib/parent-weekly-report.ts');
let p2 = fs.readFileSync('lib/parent-weekly-report.ts', 'utf8');

// The dummy Proxy exists in parent-weekly-report.ts! Remove it!
if (p2.includes('const t: any = new Proxy')) {
  p2 = p2.replace(/const t: any = new Proxy[^\n]*\n/, '');
}
// It has occurrences of `((t as any).extracted_2026_v2?.` which should be replaced by `en.extracted_2026_v2?.`
p2 = p2.replace(/\(\(t as any\)\.extracted_2026_v2\?\./g, 'en.extracted_2026_v2?.');

// Now literal Arabic replacements
p2 = p2.replace(/>السلام عليكم، \$\{parentName\}</g, '>${en.extracted_2026_v2?.["السلام عليكم "] || "السلام عليكم "}${parentName}<');
p2 = p2.replace(/>تقرير \$\{childName\} لهذا الأسبوع</g, '>${en.extracted_2026_v2?.["تقرير "] || "تقرير "}${childName} ${en.extracted_2026_v2?.["لهذا الأسبوع"] || "لهذا الأسبوع"}<');
p2 = p2.replace(/>تلاوة</g, '>${en.extracted_2026_v2?.["تلاوة"] || "تلاوة"}<');
p2 = p2.replace(/>جلسة حضرها</g, '>${en.extracted_2026_v2?.["جلسة حضرها"] || "جلسة حضرها"}<');
p2 = p2.replace(/>شارة جديدة</g, '>${en.extracted_2026_v2?.["شارة جديدة"] || "شارة جديدة"}<');
p2 = p2.replace(/>جلسة قادمة</g, '>${en.extracted_2026_v2?.["جلسة قادمة"] || "جلسة قادمة"}<');
p2 = p2.replace(/>المستوى الحالي</g, '>${en.extracted_2026_v2?.["المستوى الحالي"] || "المستوى الحالي"}<');
p2 = p2.replace(/>📖 التلاوات \(Recitations\)</g, '>${en.extracted_2026_v2?.["📖 التلاوات (Recitations)"] || "📖 التلاوات (Recitations)"}<');
p2 = p2.replace(/>🎙️ الجلسات \(Sessions\)</g, '>${en.extracted_2026_v2?.["🎙️ الجلسات (Sessions)"] || "🎙️ الجلسات (Sessions)"}<');
p2 = p2.replace(/>🏅 الشارات الجديدة</g, '>${en.extracted_2026_v2?.["🏅 الشارات الجديدة"] || "🏅 الشارات الجديدة"}<');
p2 = p2.replace(/>عرض التقرير الكامل في المنصة</g, '>${en.extracted_2026_v2?.["عرض التقرير الكامل في المنصة"] || "عرض التقرير الكامل في المنصة"}<');
p2 = p2.replace(/منصة إتقان التعليمية — جميع الحقوق محفوظة/g, '${en.extracted_2026_v2?.["منصة إتقان التعليمية — جميع الحقوق محفوظة"] || "منصة إتقان التعليمية — جميع الحقوق محفوظة"}');

p2 = p2.replace(/`تقرير \$\{child\.name\} الأسبوعي — إتقان التعليمية`/g, '`${en.extracted_2026_v2?.["تقرير "] || "تقرير "}${child.name}${en.extracted_2026_v2?.[" الأسبوعي — إتقان التعليمية"] || " الأسبوعي — إتقان التعليمية"}`');
p2 = p2.replace(/`تقرير الأسبوع: \$\{summary\.recitations_count\} تلاوة، \$\{summary\.sessions_attended\} جلسة حضرها، \$\{summary\.badges_earned\} شارة جديدة`/g, '`${en.extracted_2026_v2?.["تقرير الأسبوع: "] || "تقرير الأسبوع: "}${summary.recitations_count}${en.extracted_2026_v2?.[" تلاوة، "] || " تلاوة، "}${summary.sessions_attended}${en.extracted_2026_v2?.[" جلسة حضرها، "] || " جلسة حضرها، "}${summary.badges_earned}${en.extracted_2026_v2?.[" شارة جديدة"] || " شارة جديدة"}`');

// Re-wrap "إتقان التعليمية" where missed
p2 = p2.replace(/>إتقان التعليمية</g, '>${en.extracted_2026_v2?.[" إتقان التعليمية"] || " إتقان التعليمية"}<');
p2 = p2.replace(/>التقرير الأسبوعي</g, '>${en.extracted_2026_v2?.["التقرير الأسبوعي"] || "التقرير الأسبوعي"}<');

fs.writeFileSync('lib/parent-weekly-report.ts', p2);

console.log("Safely injected English variables in both files!");
