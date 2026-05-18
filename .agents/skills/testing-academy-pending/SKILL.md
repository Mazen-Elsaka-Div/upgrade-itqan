---
name: testing-academy-pending
description: Test the academy pending application page, especially rejected teacher states and reapply behavior. Use when changing /academy/pending or related auth application APIs.
---

# Testing /academy/pending

## Devin Secrets Needed

- None for deterministic mocked-browser testing.
- Optional for live production/staging verification: credentials for a rejected teacher account, if the user wants a real-account test instead of mocked API responses.

## Recommended Test Path

1. Build or run the app locally:
   ```bash
   pnpm run build
   PORT=3010 pnpm start
   ```
2. Use Chrome CDP with Puppeteer request interception against `http://localhost:3010/academy/pending`.
3. Mock these endpoints:
   - `GET /api/auth/me`
   - `GET /api/auth/application/me`
   - `POST /api/auth/reapply`
   - `POST /api/auth/logout` if the UI might call it
4. For rejected fallback testing:
   - Return `{ user: { role: "teacher", approval_status: "rejected" } }` from `/api/auth/me`.
   - Return HTTP 500 from `/api/auth/application/me`.
   - Assert the page shows `تم رفض طلبك` and `إعادة التقديم مرة أخرى`.
   - Assert the generic load error `تعذّر تحميل بيانات طلبك` is not shown.
5. For rejection reason testing:
   - Return rejected application data with `rejection_reason` from `/api/auth/application/me`.
   - Assert `سبب الرفض` and the exact reason render.
   - Assert `نموذج طلب الانضمام` is not rendered in the rejected state.
6. For reapply testing:
   - Mock `POST /api/auth/reapply` to return 200 and then switch `/api/auth/application/me` to a draft/pending response with at least one question.
   - Click `إعادة التقديم مرة أخرى`.
   - Assert `/api/auth/reapply` was called once.
   - Assert the page changes to `نموذج طلب الانضمام` and shows the mocked question.

## Evidence to Capture

- Screenshot of rejected fallback when the application API fails.
- Screenshot of rejected state with rejection reason.
- Screenshot of the form after successful reapply.

## Notes

- Mocked API testing is useful when no real rejected teacher credentials are available.
- If a real account is available, repeat the same assertions on the PR preview URL and note whether live database data matches the mocked scenario.
