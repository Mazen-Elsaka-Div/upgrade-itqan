# [OPEN] Debug Session: hybrid-checkbox-no-response

## Symptom
- بعد تعديل الواجهة إلى `checkbox` للوضع الهجين، الإرسال يحصل لكن النظام "مبيردش" أو لا ينفذ المسار المتوقع.

## Initial Hypotheses
- H1: الواجهة الجديدة لا تزال ترسل payload غير متوافق مع `MessageIn` في `server.py`.
- H2: عناصر الـ checkbox لا تتجمع في `app.js` بشكل صحيح، فيخرج `text` أو `to` أو `mode` بقيم ناقصة.
- H3: الـ backend يستقبل القيم الجديدة لكن `orchestrator.user_message()` يتجاهلها، فيضيع مسار `hybrid`.
- H4: تغيير الـ UI كسر event listener أو selector مهم، فزر الإرسال/Enter لم يعد يستدعي `api.send()` بالشكل الصحيح.
- H5: الرد موجود لكن لا يظهر بسبب render/state bug في الواجهة بعد تغييرات الـ checklist.

## Plan
- قراءة الواجهة الحالية والـ backend contract.
- إعادة إنتاج الإرسال فعليًا ومعرفة payload الحقيقي.
- إضافة instrumentation minimal إذا لزم لتحديد نقطة الانقطاع.
- ثم تطبيق أقل fix ممكن.
