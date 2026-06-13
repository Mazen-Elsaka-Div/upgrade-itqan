import { describe, it, expect, vi } from 'vitest'
import {
  normalizeRestrictionTarget,
  decideRestriction,
  SURAH_NAMES,
  type RestrictionList,
} from '@/lib/academy/parent-controls'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}))

describe('parent-controls', () => {
  describe('normalizeRestrictionTarget', () => {
    it('should convert numbers to strings', () => {
      expect(normalizeRestrictionTarget(42)).toBe('42')
    })

    it('should trim whitespace from strings', () => {
      expect(normalizeRestrictionTarget('  surah-1  ')).toBe('surah-1')
    })

    it('should handle string inputs as-is', () => {
      expect(normalizeRestrictionTarget('course-abc')).toBe('course-abc')
    })
  })

  describe('decideRestriction', () => {
    it('should allow when no restrictions exist', () => {
      const list: RestrictionList = { allowedIds: new Set<string>(), blockedIds: new Set<string>(), hasAllowList: false }
      expect(decideRestriction(list, '1')).toEqual({ allowed: true })
    })

    it('should block when target is in blockedIds', () => {
      const list: RestrictionList = { allowedIds: new Set<string>(), blockedIds: new Set(['1']), hasAllowList: false }
      expect(decideRestriction(list, '1')).toEqual({ allowed: false, reason: 'blocked' })
    })

    it('should allow when target is in allowedIds and hasAllowList is true', () => {
      const list: RestrictionList = { allowedIds: new Set(['1', '2']), blockedIds: new Set<string>(), hasAllowList: true }
      expect(decideRestriction(list, '1')).toEqual({ allowed: true })
    })

    it('should block when hasAllowList is true but target is not in allowedIds', () => {
      const list: RestrictionList = { allowedIds: new Set(['1', '2']), blockedIds: new Set<string>(), hasAllowList: true }
      expect(decideRestriction(list, '3')).toEqual({ allowed: false, reason: 'not_in_allowlist' })
    })

    it('should block even if in allowList when also in blockedIds', () => {
      const list: RestrictionList = { allowedIds: new Set(['1']), blockedIds: new Set(['1']), hasAllowList: true }
      expect(decideRestriction(list, '1')).toEqual({ allowed: false, reason: 'blocked' })
    })
  })

  describe('SURAH_NAMES', () => {
    it('should have 114 surahs', () => {
      expect(SURAH_NAMES).toHaveLength(114)
    })

    it('should start with Al-Fatiha', () => {
      expect(SURAH_NAMES[0]).toBe('الفاتحة')
    })

    it('should end with An-Nas', () => {
      expect(SURAH_NAMES[113]).toBe('الناس')
    })
  })
})
