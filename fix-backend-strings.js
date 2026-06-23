const fs = require('fs');

const enFile = 'd:/Workspace/Itqan Upgrade/lib/i18n/locales/en.ts';
let enContent = fs.readFileSync(enFile, 'utf8');

const translations = {
  // competitions.ts
  'المسابقة غير موجودة': 'Competition not found',
  'المسابقة غير نشطة': 'Competition is inactive',
  'الحد الأدنى للمشاركة هو ': 'The minimum participation is ',
  ' آية': ' verse(s)',
  'تم تقييم مشاركتك بالفعل ولا يمكن تعديلها': 'Your participation has already been evaluated and cannot be modified',
  'المستخدم غير موجود': 'User not found',
  'يمكن تعيين المدرّسين أو المقرئين فقط كمحكّمين': 'Only teachers or readers can be assigned as judges',
  'الدرجة يجب أن تكون بين 0 و 100': 'Score must be between 0 and 100',
  'المركز الأول': 'First Place',
  'المركز الثاني': 'Second Place',
  'المركز الثالث': 'Third Place',
  'لا توجد مشاركات مُقيّمة لاعتماد نتائجها': 'No evaluated participations to approve results',
  'حدث خطأ أثناء اعتماد النتائج': 'An error occurred while approving results',

  // points.ts
  'مبتدئ': 'Beginner',
  'متوسط': 'Intermediate',
  'متقدم': 'Advanced',
  'حافظ': 'Hafiz',
  'خاتم': 'Master',
  'تعديل يدوي من الأدمن': 'Manual adjustment by admin',
  
  // parent reports
  '<li>لا توجد تلاوات هذا الأسبوع.</li>': '<li>No recitations this week.</li>',
  '<li>لا توجد جلسات حضور مسجلة هذا الأسبوع.</li>': '<li>No attended sessions recorded this week.</li>',
  '<li>لا توجد شارات جديدة هذا الأسبوع.</li>': '<li>No new badges this week.</li>',
  'تقرير ': 'Report ',
  ' الأسبوعي': ' Weekly',
  'السلام عليكم ': 'Hello ',
  '، هذا ملخص أداء ': ', this is the performance summary for ',
  ' من ': ' from ',
  ' إلى ': ' to ',
  'تلاوات الأسبوع': 'Weekly Recitations',
  'جلسات حُضرت': 'Attended Sessions',
  'المستوى الحالي': 'Current Level',
  'الشارات الجديدة': 'New Badges',
  'التلاوات (Recitations)': 'Recitations',
  'الجلسات (Sessions)': 'Sessions',
  'الشارات': 'Badges',
  'الأسبوعي - منصة إتقان': 'Weekly - Itqan Platform',
  'الفترة: ': 'Period: ',
  'تلاوات الأسبوع: ': 'Weekly Recitations: ',
  'جلسات حُضرت: ': 'Attended Sessions: ',
  'المستوى الحالي: ': 'Current Level: ',
  'الشارات الجديدة: ': 'New Badges: ',
  
  // parent-weekly-report.ts
  'تلاوة': 'Recitation',
  'جلسة حضرها': 'Attended Session',
  'شارة جديدة': 'New Badge',
  'جلسة قادمة': 'Upcoming Session',
  '📖 التلاوات (Recitations)': '📖 Recitations',
  '<p style="color:#94a3b8; font-size:14px;">لم يتم تقديم تلاوات هذا الأسبوع.</p>': '<p style="color:#94a3b8; font-size:14px;">No recitations submitted this week.</p>',
  '🎙️ الجلسات (Sessions)': '🎙️ Sessions',
  '🏅 الشارات الجديدة': '🏅 New Badges',
  'عرض التقرير الكامل في المنصة': 'View full report on the platform',
  'منصة إتقان التعليمية — جميع الحقوق محفوظة': 'Itqan Educational Platform — All Rights Reserved',
  'تقرير الأسبوع: ': 'Weekly Report: ',
  ' تلاوة، ': ' recitation(s), ',
  ' جلسة حضرها، ': ' session(s) attended, ',
  ' إتقان التعليمية': ' Itqan Educational',
  'التقرير الأسبوعي': 'Weekly Report',
  'تقرير الأسبوعي — إتقان التعليمية': 'Weekly Report — Itqan Educational',
  'لهذا الأسبوع': 'for this week',
  
  // common
  'جلسة تسميع مع ': 'Recitation session with ',
  'مقرئ': 'Reader',
  'قيد المراجعة': 'Under Review',
  'متقن': 'Mastered',
  'بحاجة لجلسة': 'Needs Session',
  'مرفوض': 'Rejected',
  'مكتمل': 'Completed',
  'مؤكد': 'Confirmed',
  'ملغي': 'Cancelled'
};

// Inject new translations to en.ts
let injected = false;
let newEntries = '';
for (const [ar, en] of Object.entries(translations)) {
  if (!enContent.includes(`"${ar}":`)) {
    newEntries += `    ${JSON.stringify(ar)}: ${JSON.stringify(en)},\n`;
    injected = true;
  }
}
if (injected) {
  enContent = enContent.replace(/(\s*)\}\s*\}\s*$/, `,\n${newEntries}$1}\n}\n`);
  fs.writeFileSync(enFile, enContent);
  console.log('Injected missing translations into en.ts');
}

// Function to safely wrap a string
function wrap(str) {
  return `(en.extracted_2026_v2?.["${str}"] || "${str}")`;
}

// Now process the files
function processFile(filePath, replacements) {
  let c = fs.readFileSync(filePath, 'utf8');
  
  // Replace Proxy with import
  if (c.includes('const t: any = new Proxy')) {
    c = c.replace(/const t: any = new Proxy[^\n]*\n/, '');
  }
  if (!c.includes("import en from '@/lib/i18n/locales/en'")) {
    let lines = c.split('\n');
    let insertIdx = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import')) insertIdx = i + 1;
    }
    lines.splice(insertIdx, 0, "import en from '@/lib/i18n/locales/en';");
    c = lines.join('\n');
  }

  // Replace old `((t as any).extracted_2026_v2` with `(en.extracted_2026_v2`
  c = c.replace(/\(\(t as any\)\.extracted_2026_v2/g, '(en.extracted_2026_v2');

  // Apply custom replacements
  for (const rep of replacements) {
    c = c.replace(rep.regex, rep.replacement);
  }

  fs.writeFileSync(filePath, c);
  console.log(`Processed ${filePath}`);
}

// 1. competitions.ts
processFile('d:/Workspace/Itqan Upgrade/lib/academy/competitions.ts', [
  { regex: /'المسابقة غير موجودة'/g, replacement: wrap('المسابقة غير موجودة') },
  { regex: /'المسابقة غير نشطة'/g, replacement: wrap('المسابقة غير نشطة') },
  { regex: /'تم تقييم مشاركتك بالفعل ولا يمكن تعديلها'/g, replacement: wrap('تم تقييم مشاركتك بالفعل ولا يمكن تعديلها') },
  { regex: /'المستخدم غير موجود'/g, replacement: wrap('المستخدم غير موجود') },
  { regex: /'يمكن تعيين المدرّسين أو المقرئين فقط كمحكّمين'/g, replacement: wrap('يمكن تعيين المدرّسين أو المقرئين فقط كمحكّمين') },
  { regex: /'الدرجة يجب أن تكون بين 0 و 100'/g, replacement: wrap('الدرجة يجب أن تكون بين 0 و 100') },
  { regex: /'المركز الأول'/g, replacement: wrap('المركز الأول') },
  { regex: /'المركز الثاني'/g, replacement: wrap('المركز الثاني') },
  { regex: /'المركز الثالث'/g, replacement: wrap('المركز الثالث') },
  { regex: /'لا توجد مشاركات مُقيّمة لاعتماد نتائجها'/g, replacement: wrap('لا توجد مشاركات مُقيّمة لاعتماد نتائجها') },
  { regex: /'حدث خطأ أثناء اعتماد النتائج'/g, replacement: wrap('حدث خطأ أثناء اعتماد النتائج') },
]);

// 2. points.ts
processFile('d:/Workspace/Itqan Upgrade/lib/academy/points.ts', [
  { regex: /'مبتدئ'/g, replacement: wrap('مبتدئ') },
  { regex: /'متوسط'/g, replacement: wrap('متوسط') },
  { regex: /'متقدم'/g, replacement: wrap('متقدم') },
  { regex: /'حافظ'/g, replacement: wrap('حافظ') },
  { regex: /'خاتم'/g, replacement: wrap('خاتم') },
  { regex: /'تعديل يدوي من الأدمن'/g, replacement: wrap('تعديل يدوي من الأدمن') },
]);

// 3. parent-reports.ts
processFile('d:/Workspace/Itqan Upgrade/lib/academy/parent-reports.ts', [
  { regex: /<h2 style="color:#0B3D2E;">تقرير \$\{report\.childName\} الأسبوعي<\/h2>/g, replacement: `<h2 style="color:#0B3D2E;">\$\{${wrap('تقرير ')}\}\$\{report.childName\}\$\{${wrap(' الأسبوعي')}\}</h2>` },
  { regex: /<p>السلام عليكم \$\{report\.parentName\}، هذا ملخص أداء \$\{report\.childName\} من \$\{report\.weekStart\} إلى \$\{report\.weekEnd\}\.<\/p>/g, replacement: `<p>\$\{${wrap('السلام عليكم ')}\}\$\{report.parentName\}\$\{${wrap('، هذا ملخص أداء ')}\}\$\{report.childName\}\$\{${wrap(' من ')}\}\$\{report.weekStart\}\$\{${wrap(' إلى ')}\}\$\{report.weekEnd\}.</p>` },
  { regex: /<strong>تلاوات الأسبوع<\/strong>/g, replacement: `<strong>\$\{${wrap('تلاوات الأسبوع')}\}</strong>` },
  { regex: /<strong>جلسات حُضرت<\/strong>/g, replacement: `<strong>\$\{${wrap('جلسات حُضرت')}\}</strong>` },
  { regex: /<strong>المستوى الحالي<\/strong>/g, replacement: `<strong>\$\{${wrap('المستوى الحالي')}\}</strong>` },
  { regex: /<strong>الشارات الجديدة<\/strong>/g, replacement: `<strong>\$\{${wrap('الشارات الجديدة')}\}</strong>` },
  { regex: /<h3>التلاوات \(Recitations\)<\/h3>/g, replacement: `<h3>\$\{${wrap('التلاوات (Recitations)')}\}</h3>` },
  { regex: /<h3>الجلسات \(Sessions\)<\/h3>/g, replacement: `<h3>\$\{${wrap('الجلسات (Sessions)')}\}</h3>` },
  { regex: /<h3>الشارات<\/h3>/g, replacement: `<h3>\$\{${wrap('الشارات')}\}</h3>` },
  { regex: /`تقرير \$\{report\.childName\} الأسبوعي`/g, replacement: `\`\$\{${wrap('تقرير ')}\}\$\{report.childName\}\$\{${wrap(' الأسبوعي')}\}\`` },
  { regex: /`الفترة: \$\{report\.weekStart\} إلى \$\{report\.weekEnd\}`/g, replacement: `\`\$\{${wrap('الفترة: ')}\}\$\{report.weekStart\}\$\{${wrap(' إلى ')}\}\$\{report.weekEnd\}\`` },
  { regex: /`تلاوات الأسبوع: \$\{report\.recitationsCount\}`/g, replacement: `\`\$\{${wrap('تلاوات الأسبوع: ')}\}\$\{report.recitationsCount\}\`` },
  { regex: /`جلسات حُضرت: \$\{report\.sessionsAttended\}`/g, replacement: `\`\$\{${wrap('جلسات حُضرت: ')}\}\$\{report.sessionsAttended\}\`` },
  { regex: /`المستوى الحالي: \$\{report\.currentLevel\}`/g, replacement: `\`\$\{${wrap('المستوى الحالي: ')}\}\$\{report.currentLevel\}\`` },
  { regex: /`الشارات الجديدة: \$\{report\.badgesEarned\}`/g, replacement: `\`\$\{${wrap('الشارات الجديدة: ')}\}\$\{report.badgesEarned\}\`` },
  { regex: /`تقرير \$\{report\.childName\} الأسبوعي - منصة إتقان`/g, replacement: `\`\$\{${wrap('تقرير ')}\}\$\{report.childName\} \$\{${wrap('الأسبوعي - منصة إتقان')}\}\`` },
]);

// 4. parent-weekly-report.ts
processFile('d:/Workspace/Itqan Upgrade/lib/parent-weekly-report.ts', [
  { regex: /'جلسة تسميع مع '/g, replacement: wrap('جلسة تسميع مع ') },
  { regex: /'مقرئ'/g, replacement: wrap('مقرئ') },
  { regex: /"إتقان التعليمية"/g, replacement: `\$\{${wrap(' إتقان التعليمية')}\}` },
  { regex: /"التقرير الأسبوعي"/g, replacement: `\$\{${wrap('التقرير الأسبوعي')}\}` },
  { regex: />السلام عليكم، \$\{parentName\}</g, replacement: `>\$\{${wrap('السلام عليكم ')}\}\$\{parentName\}<` },
  { regex: />تقرير \$\{childName\} لهذا الأسبوع</g, replacement: `>\$\{${wrap('تقرير ')}\}\$\{childName\} \$\{${wrap('لهذا الأسبوع')}\}<` },
  { regex: />تلاوة</g, replacement: `>\$\{${wrap('تلاوة')}\}<` },
  { regex: />جلسة حضرها</g, replacement: `>\$\{${wrap('جلسة حضرها')}\}<` },
  { regex: />شارة جديدة</g, replacement: `>\$\{${wrap('شارة جديدة')}\}<` },
  { regex: />جلسة قادمة</g, replacement: `>\$\{${wrap('جلسة قادمة')}\}<` },
  { regex: />المستوى الحالي</g, replacement: `>\$\{${wrap('المستوى الحالي')}\}<` },
  { regex: />📖 التلاوات \(Recitations\)</g, replacement: `>\$\{${wrap('📖 التلاوات (Recitations)')}\}<` },
  { regex: />🎙️ الجلسات \(Sessions\)</g, replacement: `>\$\{${wrap('🎙️ الجلسات (Sessions)')}\}<` },
  { regex: />🏅 الشارات الجديدة</g, replacement: `>\$\{${wrap('🏅 الشارات الجديدة')}\}<` },
  { regex: />عرض التقرير الكامل في المنصة</g, replacement: `>\$\{${wrap('عرض التقرير الكامل في المنصة')}\}<` },
  { regex: />منصة إتقان التعليمية — جميع الحقوق محفوظة</g, replacement: `>\$\{${wrap('منصة إتقان التعليمية — جميع الحقوق محفوظة')}\}<` },
  { regex: /`تقرير \$\{child\.name\} الأسبوعي — إتقان التعليمية`/g, replacement: `\`\$\{${wrap('تقرير ')}\}\$\{child.name\}\$\{${wrap(' الأسبوعي — إتقان التعليمية')}\}\`` },
  { regex: /`تقرير الأسبوع: \$\{summary\.recitations_count\} تلاوة، \$\{summary\.sessions_attended\} جلسة حضرها، \$\{summary\.badges_earned\} شارة جديدة`/g, replacement: `\`\$\{${wrap('تقرير الأسبوع: ')}\}\$\{summary.recitations_count\}\$\{${wrap(' تلاوة، ')}\}\$\{summary.sessions_attended\}\$\{${wrap(' جلسة حضرها، ')}\}\$\{summary.badges_earned\}\$\{${wrap(' شارة جديدة')}\}\`` },
  { regex: /إتقان التعليمية/g, replacement: `\$\{${wrap(' إتقان التعليمية')}\}` }, // Catch remaining plain text in template literals
  { regex: /التقرير الأسبوعي/g, replacement: `\$\{${wrap('التقرير الأسبوعي')}\}` },
]);
