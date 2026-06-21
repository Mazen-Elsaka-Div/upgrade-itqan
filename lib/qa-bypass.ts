/**
 * QA OTP bypass — single source of truth.
 *
 * E2E/automation suites (Playwright, TestSprite, etc.) cannot poll a real inbox
 * to read the email verification code, which blocks the entire signup flow.
 *
 * This module centralises the decision of whether a given verification attempt
 * may use the configured static QA bypass code. Keeping it pure (no DB, no
 * Next.js request objects) means it can be unit-tested exhaustively and reused
 * anywhere a verification code is checked, so the gating rules can never drift
 * between call sites.
 *
 * The bypass is gated by THREE independent conditions — if ANY is missing the
 * bypass is silently disabled and the normal verification_code flow is enforced:
 *   1. QA_BYPASS_CODE env var is set (acts as the magic code).
 *   2. The user's email is in QA_TEST_EMAILS (comma-separated whitelist).
 *   3. NODE_ENV is not 'production', OR ALLOW_QA_BYPASS_IN_PROD === 'true'.
 */

export interface QaBypassEnv {
  QA_BYPASS_CODE?: string
  QA_TEST_EMAILS?: string
  NODE_ENV?: string
  ALLOW_QA_BYPASS_IN_PROD?: string
}

/** Parse the comma-separated whitelist into a normalised (lowercased) array. */
export function parseQaTestEmails(raw: string | undefined): string[] {
  return (raw || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Whether the QA bypass is *enabled* for this email in the current environment,
 * regardless of which code the caller submitted. Use this to decide whether the
 * bypass machinery is even active.
 */
export function isQaBypassEnabled(email: string, env: QaBypassEnv = process.env): boolean {
  const code = env.QA_BYPASS_CODE
  if (!code) return false

  const whitelist = parseQaTestEmails(env.QA_TEST_EMAILS)
  if (!whitelist.includes((email || "").trim().toLowerCase())) return false

  const isProd = env.NODE_ENV === "production"
  if (isProd && env.ALLOW_QA_BYPASS_IN_PROD !== "true") return false

  return true
}

/**
 * Whether the submitted code should be accepted via the QA bypass. This is true
 * only when the bypass is enabled for the email AND the submitted code exactly
 * matches the configured QA_BYPASS_CODE.
 */
export function isQaBypassCode(
  email: string,
  submittedCode: string,
  env: QaBypassEnv = process.env,
): boolean {
  if (!isQaBypassEnabled(email, env)) return false
  return !!env.QA_BYPASS_CODE && submittedCode === env.QA_BYPASS_CODE
}
