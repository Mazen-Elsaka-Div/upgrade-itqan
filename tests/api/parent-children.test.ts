import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, DELETE } from '@/app/api/academy/parent/children/route'

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}))

import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

const mockGetSession = vi.mocked(getSession)
const mockQuery = vi.mocked(query)
const mockQueryOne = vi.mocked(queryOne)

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

describe('/api/academy/parent/children', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const req = createRequest('http://localhost/api/academy/parent/children')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it('should return active children by default', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockQuery
        .mockResolvedValueOnce([
          { id: 'link-1', child_id: 'child-1', child_name: 'Ahmed', child_email: 'ahmed@test.com', child_avatar: null, relation: 'father', status: 'active', linked_at: '2024-01-01' },
        ])
        .mockResolvedValueOnce([{ status: 'active', count: '1' }])

      const req = createRequest('http://localhost/api/academy/parent/children')
      const res = await GET(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.children).toHaveLength(1)
      expect(body.children[0].child_name).toBe('Ahmed')
      expect(body.summary.active).toBe(1)
    })

    it('should return all children when status=all', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockQuery
        .mockResolvedValueOnce([
          { id: 'link-1', child_id: 'child-1', child_name: 'Ahmed', child_email: 'ahmed@test.com', child_avatar: null, relation: 'father', status: 'active', linked_at: '2024-01-01' },
          { id: 'link-2', child_id: 'child-2', child_name: 'Sara', child_email: 'sara@test.com', child_avatar: null, relation: 'mother', status: 'pending', linked_at: '2024-06-01' },
        ])
        .mockResolvedValueOnce([
          { status: 'active', count: '1' },
          { status: 'pending', count: '1' },
        ])

      const req = createRequest('http://localhost/api/academy/parent/children?status=all')
      const res = await GET(req)
      const body = await res.json()

      expect(body.children).toHaveLength(2)
    })
  })

  describe('DELETE', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const req = createRequest('http://localhost/api/academy/parent/children', {
        method: 'DELETE',
        body: JSON.stringify({ child_id: 'child-1' }),
      })
      const res = await DELETE(req)
      expect(res.status).toBe(401)
    })

    it('should return 400 when child_id is missing', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      const req = createRequest('http://localhost/api/academy/parent/children', {
        method: 'DELETE',
        body: JSON.stringify({}),
      })
      const res = await DELETE(req)
      expect(res.status).toBe(400)
    })

    it('should return 404 when link does not exist', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockQuery.mockResolvedValue([])
      const req = createRequest('http://localhost/api/academy/parent/children', {
        method: 'DELETE',
        body: JSON.stringify({ child_id: 'child-1' }),
      })
      const res = await DELETE(req)
      expect(res.status).toBe(404)
    })

    it('should successfully unlink a child', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockQuery
        .mockResolvedValueOnce([{ id: 'link-1' }]) // verify link exists
        .mockResolvedValueOnce([]) // delete

      const req = createRequest('http://localhost/api/academy/parent/children', {
        method: 'DELETE',
        body: JSON.stringify({ child_id: 'child-1' }),
      })
      const res = await DELETE(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })
})
