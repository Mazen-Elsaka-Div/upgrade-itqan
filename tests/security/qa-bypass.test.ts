import { describe, it, expect } from 'vitest'
import {
  isQaBypassEnabled,
  isQaBypassCode,
  parseQaTestEmails,
  type QaBypassEnv,
} from '@/lib/qa-bypass'

/**
 * Regression tests for issue #3: the OTP email-verification step blocks
 * automation because the code is delivered out-of-band. The QA bypass lets
 * whitelisted test emails verify with a static code — but ONLY when explicitly
 * configured, and never silently in production. These tests pin those gates.
 */
describe('QA OTP bypass gating (#3)', () => {
  const base: QaBypassEnv = {
    QA_BYPASS_CODE: '000000',
    QA_TEST_EMAILS: 'qa@test.com, Student@Test.com',
    NODE_ENV: 'test',
  }

  it('parses and normalises the email whitelist', () => {
    expect(parseQaTestEmails(' a@x.com ,B@X.com,, ')).toEqual(['a@x.com', 'b@x.com'])
    expect(parseQaTestEmails(undefined)).toEqual([])
  })

  it('is disabled when QA_BYPASS_CODE is not set', () => {
    expect(isQaBypassEnabled('qa@test.com', { ...base, QA_BYPASS_CODE: undefined })).toBe(false)
  })

  it('is disabled for emails not on the whitelist', () => {
    expect(isQaBypassEnabled('intruder@evil.com', base)).toBe(false)
  })

  it('matches whitelisted emails case-insensitively', () => {
    expect(isQaBypassEnabled('STUDENT@test.com', base)).toBe(true)
  })

  it('is disabled in production by default', () => {
    expect(isQaBypassEnabled('qa@test.com', { ...base, NODE_ENV: 'production' })).toBe(false)
  })

  it('can be explicitly enabled in production via ALLOW_QA_BYPASS_IN_PROD', () => {
    expect(
      isQaBypassEnabled('qa@test.com', {
        ...base,
        NODE_ENV: 'production',
        ALLOW_QA_BYPASS_IN_PROD: 'true',
      }),
    ).toBe(true)
  })

  it('accepts the exact bypass code for a whitelisted email', () => {
    expect(isQaBypassCode('qa@test.com', '000000', base)).toBe(true)
  })

  it('rejects a wrong code even for a whitelisted email', () => {
    expect(isQaBypassCode('qa@test.com', '123456', base)).toBe(false)
  })

  it('rejects the bypass code for a non-whitelisted email', () => {
    expect(isQaBypassCode('intruder@evil.com', '000000', base)).toBe(false)
  })

  it('never accepts an empty submitted code', () => {
    expect(isQaBypassCode('qa@test.com', '', base)).toBe(false)
  })
})
