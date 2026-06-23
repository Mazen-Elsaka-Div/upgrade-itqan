const fs = require('fs');

const file = 'd:/Workspace/Itqan Upgrade/lib/i18n/locales/en.ts';
let content = fs.readFileSync(file, 'utf8');

const newTranslations = {
  "ملاحظة المعلم: ": "Teacher Note: ",
  "ملاحظة المحكّم: ": "Judge Note: ",
  "خصائص: ": "Properties: ",
  "أعزب\\\\\\\\nمتزوج\\\\\\\\nمطلق": "Single\\nMarried\\nDivorced",
  " ، ": ", ",
  " ← مستمر": " ← Ongoing",
  "التخزين السحابي مفعّل. تُحفظ التسجيلات تلقائياً على السحابة (S3)\\r\\n                وتظهر في صفحة «الجلسات والبث المباشر» ضمن تبويب «التسجيلات» بعد انتهاء كل جلسة.": "Cloud storage is enabled. Recordings are automatically saved to the cloud (S3)\\r\\n and appear in the 'Sessions and Live Streams' page under the 'Recordings' tab after each session ends.",
  "التخزين السحابي (S3) غير مكوّن على الخادم، لذلك لن يبدأ التسجيل.\\r\\n                يحتاج مدير النظام إلى ضبط متغيّرات البيئة:": "Cloud storage (S3) is not configured on the server, so recording will not start.\\r\\n The system administrator needs to set the environment variables:",
  "مكافأة شارة: ": "Badge Reward: ",
  "إنجاز مهمة: ": "Task Completion: ",
  "حضور جلسة: ": "Session Attendance: ",
  "إكمال درس: ": "Lesson Completion: ",
  "إكمال دورة: ": "Course Completion: ",
  "إكمال مهمة: ": "Task Completion: ",
  "فوز في مسابقة: ": "Competition Win: ",
  " المركز ": " Rank ",
  "(مضاعفة Streak ×1.5)": "(Streak Multiplier ×1.5)",
  "تم إرسال الرابط لجميع طلاب الكورس (": "Link sent to all course students (",
  " طالب)": " student(s))",
  "تم إرسال الرابط للطلاب المحددين (": "Link sent to specific students (",
  "رابط الجلسة: ": "Session Link: ",
  "الحد الأدنى للمشاركة هو ": "The minimum for participation is ",
  " آية": " verse(s)",
  " في مسابقة: ": " in competition: ",
  "إنهاء جزء كامل: ": "Finished full Juz: ",
  "إتمام جزء": "Completed Juz"
};

let additionalStr = '';
for (const [key, val] of Object.entries(newTranslations)) {
  additionalStr += `    ${JSON.stringify(key)}: ${JSON.stringify(val)},\n`;
}

// Find where `extracted_2026_v2` ends and inject before `}`
content = content.replace(/(\s*)\}\s*\}\s*$/, `,\n${additionalStr}$1}\n}\n`);

fs.writeFileSync(file, content);
console.log('Injected 19 manual translations to en.ts');
