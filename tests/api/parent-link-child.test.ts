import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/academy/parent/link-child/route'

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

function createRequest(body: object) {
  return new Request('http://localhost/api/academy/parent/link-child', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

describe('/api/academy/parent/link-child', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await POST(createRequest({ action: 'search', email: 'test@test.com' }))
    expect(res.status).toBe(401)
  })

  describe('search action', () => {
    it('should return 400 when email is missing', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      const res = await POST(createRequest({ action: 'search' }))
      expect(res.status).toBe(400)
    })

    it('should return 404 when student not found', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockQueryOne.mockResolvedValue(null)
      const res = await POST(createRequest({ action: 'search', email: 'notfound@test.com' }))
      expect(res.status).toBe(404)
    })

    it('should return student when found', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockQueryOne
        .mockResolvedValueOnce({ id: 'student-1', name: 'Ahmed', email: 'ahmed@test.com', avatar_url: null })
        .mockResolvedValueOnce(null) // no existing link

      const res = await POST(createRequest({ action: 'search', email: 'ahmed@test.com' }))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.student.name).toBe('Ahmed')
    })

    it('should return 409 when link already exists', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockQueryOne
        .mockResolvedValueOnce({ id: 'student-1', name: 'Ahmed', email: 'ahmed@test.com', avatar_url: null })
        .mockResolvedValueOnce({ status: 'active' })

      const res = await POST(createRequest({ action: 'search', email: 'ahmed@test.com' }))
      expect(res.status).toBe(409)
    })
  })

  describe('link action', () => {
    it('should return 400 when child_id is missing', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      const res = await POST(createRequest({ action: 'link', relation: 'father' }))
      expect(res.status).toBe(400)
    })

    it('should return 400 when relation is invalid', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      const res = await POST(createRequest({ action: 'link', child_id: 'child-1', relation: 'invalid' }))
      expect(res.status).toBe(400)
    })

    it('should return 404 when student does not exist', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockQueryOne.mockResolvedValue(null)
      const res = await POST(createRequest({ action: 'link', child_id: 'child-1', relation: 'father' }))
      expect(res.status).toBe(404)
    })

    it('should create pending link request', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockQueryOne
        .mockResolvedValueOnce({ id: 'student-1', name: 'Ahmed' }) // student exists
        .mockResolvedValueOnce(null) // no existing link
        .mockResolvedValueOnce({ name: 'Parent' }) // parent name for notification
      mockQuery.mockResolvedValue([]) // insert + notification

      const res = await POST(createRequest({ action: 'link', child_id: 'student-1', relation: 'father' }))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })

    it('should return 409 when link is already active', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockQueryOne
        .mockResolvedValueOnce({ id: 'student-1', name: 'Ahmed' })
        .mockResolvedValueOnce({ id: 'link-1', status: 'active' })

      const res = await POST(createRequest({ action: 'link', child_id: 'student-1', relation: 'father' }))
      expect(res.status).toBe(409)
    })

    it('should re-create link when previously rejected', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockQueryOne
        .mockResolvedValueOnce({ id: 'student-1', name: 'Ahmed' })
        .mockResolvedValueOnce({ id: 'link-1', status: 'rejected' })
        .mockResolvedValueOnce({ name: 'Parent' })
      mockQuery.mockResolvedValue([])

      const res = await POST(createRequest({ action: 'link', child_id: 'student-1', relation: 'mother' }))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })

  it('should return 400 for invalid action', async () => {
    mockGetSession.mockResolvedValue(createParentSession())
    const res = await POST(createRequest({ action: 'invalid' }))
    expect(res.status).toBe(400)
  })
})
