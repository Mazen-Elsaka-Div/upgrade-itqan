const fs = require('fs');

let file1 = 'd:/Workspace/Itqan Upgrade/components/academy/send-meeting-link-modal.tsx';
let c1 = fs.readFileSync(file1, 'utf8');

c1 = c1.replace(
    /`تم إرسال الرابط لجميع طلاب الكورس \(\$\{data\.recipientsCount\} طالب\)`/g,
    '`${((t as any).extracted_2026_v2?.["تم إرسال الرابط لجميع طلاب الكورس ("] || "تم إرسال الرابط لجميع طلاب الكورس (")}${data.recipientsCount}${((t as any).extracted_2026_v2?.[" طالب)"] || " طالب)")}`'
);

c1 = c1.replace(
    /`تم إرسال الرابط للطلاب المحددين \(\$\{data\.recipientsCount\} طالب\)`/g,
    '`${((t as any).extracted_2026_v2?.["تم إرسال الرابط للطلاب المحددين ("] || "تم إرسال الرابط للطلاب المحددين (")}${data.recipientsCount}${((t as any).extracted_2026_v2?.[" طالب)"] || " طالب)")}`'
);

c1 = c1.replace(
    /placeholder=\{`رابط الجلسة: \$\{sessionTitle\}`\}/g,
    'placeholder={`${((t as any).extracted_2026_v2?.["رابط الجلسة: "] || "رابط الجلسة: ")}${sessionTitle}`}'
);

fs.writeFileSync(file1, c1);
console.log('Fixed send-meeting-link-modal.tsx');
