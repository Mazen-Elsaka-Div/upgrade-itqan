import { type NextRequest } from "next/server"

/**
 * Verify that a cron request is authorized via CRON_SECRET.
 * Accepts the secret from the x-cron-secret header or Bearer token.
 * Does NOT accept query params (secrets in URLs get logged).
 *
 * In production: rejects if CRON_SECRET is not configured.
 * In development: allows if CRON_SECRET is not configured.
 */
export function isCronAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    if (process.env.NODE_ENV === "production") return false
    return true // dev only
  }
  const fromHeader =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  return fromHeader === expected
}
