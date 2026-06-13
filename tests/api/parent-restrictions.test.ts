import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT } from '@/app/api/academy/parent/restrictions/route'

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}))

vi.mock('@/lib/academy/parent-controls', () => ({
  getParentChildRestrictions: vi.fn(),
  replaceParentChildAllowList: vi.fn(),
  SURAH_NAMES: Array.from({ length: 114 }, (_, i) => `Surah ${i + 1}`),
  normalizeRestrictionTarget: vi.fn((v) => String(v)),
}))

import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { getParentChildRestrictions, replaceParentChildAllowList } from '@/lib/academy/parent-controls'

const mockGetSession = vi.mocked(getSession)
const mockQuery = vi.mocked(query)
const mockGetRestrictions = vi.mocked(getParentChildRestrictions)
const mockReplaceAllowList = vi.mocked(replaceParentChildAllowList)

function createParentSession() {
  return {
    sub: 'parent-1',
    email: 'parent@test.com',
    role: 'parent' as const,
    name: 'Parent',
    iat: Date.now(),
    exp: Date.now() + 86400000,
  }
}

function createRequest(url: string, options?: RequestInit) {
  return new Request(url, options) as any
}

describe('/api/academy/parent/restrictions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await GET(createRequest('http://localhost/api/academy/parent/restrictions?childId=c1'))
      expect(res.status).toBe(401)
    })

    it('should return 400 when childId is missing', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      const res = await GET(createRequest('http://localhost/api/academy/parent/restrictions'))
      expect(res.status).toBe(400)
    })

    it('should return restrictions for a child', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockGetRestrictions.mockResolvedValue([
        { id: 'r1', parent_child_id: 'pc1', restriction_type: 'surah', target_id: '1', is_blocked: true },
        { id: 'r2', parent_child_id: 'pc1', restriction_type: 'course', target_id: 'c1', is_blocked: true },
      ])
      mockQuery
        .mockResolvedValueOnce([]) // courses
        .mockResolvedValueOnce([]) // tajweed paths
        .mockResolvedValueOnce([]) // memorization paths

      const res = await GET(createRequest('http://localhost/api/academy/parent/restrictions?childId=child-1'))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.restrictions.surah).toContain('1')
      expect(body.restrictions.course).toContain('c1')
      expect(body.options.surahs).toHaveLength(114)
    })
  })

  describe('PUT', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await PUT(createRequest('http://localhost/api/academy/parent/restrictions', {
        method: 'PUT',
        body: JSON.stringify({ childId: 'c1', restrictions: {} }),
      }))
      expect(res.status).toBe(401)
    })

    it('should return 400 when childId is missing', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      const res = await PUT(createRequest('http://localhost/api/academy/parent/restrictions', {
        method: 'PUT',
        body: JSON.stringify({ restrictions: {} }),
      }))
      expect(res.status).toBe(400)
    })

    it('should return 403 when child is not linked', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockReplaceAllowList.mockResolvedValue(false)

      const res = await PUT(createRequest('http://localhost/api/academy/parent/restrictions', {
        method: 'PUT',
        body: JSON.stringify({ childId: 'child-1', restrictions: {} }),
      }))
      expect(res.status).toBe(403)
    })

    it('should update restrictions successfully', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockReplaceAllowList.mockResolvedValue(true)
      mockGetRestrictions.mockResolvedValue([
        { id: 'r1', parent_child_id: 'pc1', restriction_type: 'surah', target_id: '1', is_blocked: true },
      ])

      const res = await PUT(createRequest('http://localhost/api/academy/parent/restrictions', {
        method: 'PUT',
        body: JSON.stringify({
          childId: 'child-1',
          restrictions: { surah: ['1', '2'], course: [] },
        }),
      }))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })
})
