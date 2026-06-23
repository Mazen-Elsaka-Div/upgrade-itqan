const fs = require('fs');

let c1 = fs.readFileSync('lib/academy/competitions.ts', 'utf8');
c1 = c1.replace(
    /throw new Error\(`الحد الأدنى للمشاركة هو \$\{minVerses\} آية`\)/g,
    'throw new Error(`${((t as any).extracted_2026_v2?.["الحد الأدنى للمشاركة هو "] || "الحد الأدنى للمشاركة هو ")}${minVerses}${((t as any).extracted_2026_v2?.[" آية"] || " آية")}`)'
);
c1 = c1.replace(
    /description: `\$\{rankLabel\} في مسابقة: \$\{comp\.title \?\? ''\}`/g,
    'description: `${rankLabel}${((t as any).extracted_2026_v2?.[" في مسابقة: "] || " في مسابقة: ")}${comp.title ?? \'\'}`'
);
if (!c1.includes('const t: any = new Proxy')) {
    c1 = `\nconst t: any = new Proxy({}, { get: () => new Proxy({}, { get: () => undefined }) });\n` + c1;
}
fs.writeFileSync('lib/academy/competitions.ts', c1);

let c2 = fs.readFileSync('lib/academy/points.ts', 'utf8');
c2 = c2.replace(
    /\{ description: `إكمال مهمة: \$\{taskId\}` \}/g,
    '{ description: `${((t as any).extracted_2026_v2?.["إكمال مهمة: "] || "إكمال مهمة: ")}${taskId}` }'
);
c2 = c2.replace(
    /\{ description: `حضور جلسة: \$\{sessionId\}` \}/g,
    '{ description: `${((t as any).extracted_2026_v2?.["حضور جلسة: "] || "حضور جلسة: ")}${sessionId}` }'
);
c2 = c2.replace(
    /\{ description: `فوز في مسابقة: \$\{competitionId\} المركز \$\{position\}` \}/g,
    '{ description: `${((t as any).extracted_2026_v2?.["فوز في مسابقة: "] || "فوز في مسابقة: ")}${competitionId}${((t as any).extracted_2026_v2?.[" المركز "] || " المركز ")}${position}` }'
);
if (!c2.includes('const t: any = new Proxy')) {
    c2 = `\nconst t: any = new Proxy({}, { get: () => new Proxy({}, { get: () => undefined }) });\n` + c2;
}
fs.writeFileSync('lib/academy/points.ts', c2);

let c3 = fs.readFileSync('components/academy/send-meeting-link-modal.tsx', 'utf8');
c3 = c3.replace(
    /`تم إرسال الرابط لجميع طلاب الكورس \(\$\{data\.recipientsCount\} طالب\)`/g,
    '`${((t as any).extracted_2026_v2?.["تم إرسال الرابط لجميع طلاب الكورس ("] || "تم إرسال الرابط لجميع طلاب الكورس (")}${data.recipientsCount}${((t as any).extracted_2026_v2?.[" طالب)"] || " طالب)")}`'
);
c3 = c3.replace(
    /`تم إرسال الرابط للطلاب المحددين \(\$\{data\.recipientsCount\} طالب\)`/g,
    '`${((t as any).extracted_2026_v2?.["تم إرسال الرابط للطلاب المحددين ("] || "تم إرسال الرابط للطلاب المحددين (")}${data.recipientsCount}${((t as any).extracted_2026_v2?.[" طالب)"] || " طالب)")}`'
);
c3 = c3.replace(
    /placeholder=\{`رابط الجلسة: \$\{sessionTitle\}`\}/g,
    'placeholder={`${((t as any).extracted_2026_v2?.["رابط الجلسة: "] || "رابط الجلسة: ")}${sessionTitle}`}'
);
if (!c3.includes('const t: any = new Proxy')) {
    let lines = c3.split('\\n');
    let insertIdx = lines[0].includes('use client') ? 1 : 0;
    lines.splice(insertIdx, 0, '\\nconst t: any = new Proxy({}, { get: () => new Proxy({}, { get: () => undefined }) });');
    c3 = lines.join('\\n');
}
fs.writeFileSync('components/academy/send-meeting-link-modal.tsx', c3);

console.log('Fixed files safely');
