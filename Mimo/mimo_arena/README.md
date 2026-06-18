# MIMO Arena

لوحة قيادة لتشغيل عدة نسخ من `mimo` بالتوازي، مع **Gemini كمايسترو**،
**Scout للتحليل**، و**منفّذين (executors)** قابلين للتوسعة — وكل ده بواجهة ويب
احترافية فيها نظام شاتات محفوظة.

## الفكرة باختصار

```
   أنت (المتصفح)
        │
        ▼
┌─────────────────┐      JSON files       ┌──────────────────┐
│   MIMO Arena    │  ◄──────────────────► │   Gemini (أنت)   │
│  (FastAPI + WS) │  arena_outbox.json    │   المايسترو       │
└────────┬────────┘  gemini_inbox.json    └──────────────────┘
         │ يدير
         ├── Scout    (نسخة mimo مخصّصة لتحليل الملفات وعمل الخطة)
         ├── executor-1 ──┐
         ├── executor-2   ├─ نسخ mimo منفصلة (port + session لكل واحدة)
         └── executor-N ──┘   تشتغل بالتوازي
                  │
                  ▼
          مدير الأقفال (LockManager): يمنع أن يعدّل اتنين نفس الملف
```

- **كل عامل = `mimo serve` على بورت منفصل + session منفصل + ملف رسائل خاص.**
  يعني نسخ مستقلة فعلاً تقدر تشتغل في نفس اللحظة.
- **العمّال لا يرون بعضهم.** التنسيق يحصل عبر المايسترو (Gemini) ولوحة الحالة
  المشتركة (`arena_outbox.json`).
- **منع التعارض على الملفات:** أول ما عامل يبدأ يعدّل ملف **يقفله**. لو عامل
  تاني عايز نفس الملف يستنى لحد ما يتفك القفل، أو يكمّل باقي مهمته ويرجع.

## التشغيل

```bash
# من مجلد مشروعك (المكان اللي mimo بيشتغل فيه)
pip install -r mimo_arena/requirements.txt
python run.py
```

هيفتحلك المتصفح على `http://127.0.0.1:8765`.

### متغيّرات اختيارية

| المتغيّر          | المعنى                              | الافتراضي |
|-------------------|-------------------------------------|-----------|
| `MIMO_ROOT`       | مجلد تشغيل mimo                      | المجلد الحالي |
| `MIMO_BIN`        | مسار/اسم بايناري mimo                | `mimo`    |
| `MIMO_EXECUTORS`  | عدد المنفّذين عند الإقلاع            | `2`       |
| `MIMO_PORT`       | بورت واجهة الويب                     | `8765`    |
| `MIMO_BASE_PORT`  | أول بورت لـ mimo serve              | `4097`    |

## بروتوكول جسر Gemini

Gemini يقرأ حالة العالم من `‎.mimo_arena/bridge/arena_outbox.json` كل دور،
ويكتب أوامره (JSON) في `‎.mimo_arena/bridge/gemini_inbox.json`. الأوامر:

```jsonc
// يطلب من Scout يحلّل ويعمل خطة
{ "action": "scout", "message": "حلّل موديول الـ auth وحضّر خطة" }

// يوزّع مهام بالتوازي (مع تحديد ملفات كل مهمة عشان الأقفال)
{ "action": "assign", "tasks": [
    { "to": "executor-1", "message": "اكتب auth.py", "files": ["auth.py"] },
    { "to": "executor-2", "message": "اكتب api.py",  "files": ["api.py"] },
    { "to": "scout",      "message": "راجع التوافق بين الملفين" }
]}

{ "action": "say", "message": "كلام يظهر للمستخدم" }
{ "action": "add_executor" }          // يضيف عامل تنفيذ جديد
{ "action": "done", "message": "ملخّص إنجاز المهمة" }
```

## ملفات المشروع

| الملف                       | الدور |
|-----------------------------|-------|
| `mimo_arena/config.py`      | الإعدادات ومسارات الجسر |
| `mimo_arena/locks.py`       | مدير الأقفال (منع التعارض) |
| `mimo_arena/mimo_worker.py` | عامل mimo واحد (serve + run + parse JSON) |
| `mimo_arena/chat_store.py`  | تخزين الشاتات المحفوظة |
| `mimo_arena/orchestrator.py`| العقل: الأدوار + التوزيع + الجسر |
| `mimo_arena/server.py`      | FastAPI + WebSocket + REST |
| `mimo_arena/web/`           | الواجهة (HTML/JS) |
| `run.py`                    | مشغّل التطبيق |
