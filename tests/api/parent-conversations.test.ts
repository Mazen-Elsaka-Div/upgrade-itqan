import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/academy/parent/conversations/route'

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}))

vi.mock('@/lib/parent-helpers', () => ({
  getActiveParentChild: vi.fn(),
}))

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn(),
}))

import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { getActiveParentChild } from '@/lib/parent-helpers'

const mockGetSession = vi.mocked(getSession)
const mockQuery = vi.mocked(query)
const mockQueryOne = vi.mocked(queryOne)
const mockGetActiveParentChild = vi.mocked(getActiveParentChild)

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

describe('/api/academy/parent/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await GET()
      expect(res.status).toBe(401)
    })

    it('should return 403 for non-parent/teacher/admin roles', async () => {
      mockGetSession.mockResolvedValue({
        ...createParentSession(),
        role: 'student',
      } as any)
      const res = await GET()
      expect(res.status).toBe(403)
    })

    it('should return conversations for parent', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockQuery.mockResolvedValue([
        {
          id: 'conv-1',
          parent_id: 'parent-1',
          teacher_id: 'teacher-1',
          child_id: 'child-1',
          subject: 'Progress update',
          last_message: 'Thanks for the update',
          last_message_at: '2024-06-01T10:00:00Z',
          unread_count: 2,
          other_user_id: 'teacher-1',
          other_user_name: 'Sheikh Ali',
          other_user_avatar: null,
          child_name: 'Ahmed',
        },
      ])

      const res = await GET()
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.conversations).toHaveLength(1)
      expect(body.conversations[0].other_user_name).toBe('Sheikh Ali')
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await POST(new Request('http://localhost/api/academy/parent/conversations', {
        method: 'POST',
        body: JSON.stringify({ teacher_id: 't1', child_id: 'c1' }),
      }) as any)
      expect(res.status).toBe(401)
    })

    it('should return 400 when teacher_id is missing', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      const res = await POST(new Request('http://localhost/api/academy/parent/conversations', {
        method: 'POST',
        body: JSON.stringify({ child_id: 'c1' }),
      }) as any)
      expect(res.status).toBe(400)
    })

    it('should return 403 when parent-child link is inactive', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockGetActiveParentChild.mockResolvedValue(null)

      const res = await POST(new Request('http://localhost/api/academy/parent/conversations', {
        method: 'POST',
        body: JSON.stringify({ teacher_id: 'teacher-1', child_id: 'child-1' }),
      }) as any)
      expect(res.status).toBe(403)
    })

    it('should return 403 when teacher does not teach the child', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockGetActiveParentChild.mockResolvedValue({
        id: 'pc-1',
        parent_id: 'parent-1',
        child_id: 'child-1',
        relation: 'father',
        status: 'active',
        link_code: null,
        link_code_expires_at: null,
        requested_at: '2024-01-01',
        confirmed_at: '2024-01-02',
        rejected_at: null,
        created_at: '2024-01-01',
      })
      mockQueryOne.mockResolvedValue(null) // teacher not found

      const res = await POST(new Request('http://localhost/api/academy/parent/conversations', {
        method: 'POST',
        body: JSON.stringify({ teacher_id: 'teacher-1', child_id: 'child-1' }),
      }) as any)
      expect(res.status).toBe(403)
    })

    it('should create conversation successfully', async () => {
      mockGetSession.mockResolvedValue(createParentSession())
      mockGetActiveParentChild.mockResolvedValue({
        id: 'pc-1',
        parent_id: 'parent-1',
        child_id: 'child-1',
        relation: 'father',
        status: 'active',
        link_code: null,
        link_code_expires_at: null,
        requested_at: '2024-01-01',
        confirmed_at: '2024-01-02',
        rejected_at: null,
        created_at: '2024-01-01',
      })
      mockQueryOne
        .mockResolvedValueOnce({ id: 'teacher-1', name: 'Sheikh Ali' }) // teacher check
        .mockResolvedValueOnce({ id: 'conv-1' }) // upsert conversation
      mockQuery.mockResolvedValue([]) // insert message + update conversation + notification

      const res = await POST(new Request('http://localhost/api/academy/parent/conversations', {
        method: 'POST',
        body: JSON.stringify({
          teacher_id: 'teacher-1',
          child_id: 'child-1',
          subject: 'Progress',
          content: 'Hello teacher',
        }),
      }) as any)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.conversation_id).toBe('conv-1')
    })
  })
})
