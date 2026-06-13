import { describe, it, expect, vi } from 'vitest'
import { generateLinkCode } from '@/lib/parent-helpers'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}))

describe('parent-helpers', () => {
  describe('generateLinkCode', () => {
    it('should generate a 6-digit numeric string', () => {
      const code = generateLinkCode()
      expect(code).toHaveLength(6)
      expect(Number(code)).toBeGreaterThanOrEqual(100000)
      expect(Number(code)).toBeLessThanOrEqual(999999)
    })

    it('should generate unique codes', () => {
      const codes = new Set(Array.from({ length: 100 }, () => generateLinkCode()))
      expect(codes.size).toBeGreaterThan(50)
    })
  })
})
