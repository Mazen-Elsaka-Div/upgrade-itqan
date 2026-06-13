import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/academy/parent/calendar/events/route'

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}))

import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const mockGetSession = vi.mocked(getSession)
const mockQuery = vi.mocked(query)

function createRequest(url?: string) {
  return new Request(url || 'http://localhost/api/academy/parent/calendar/events') as any
}

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

describe('/api/academy/parent/calendar/events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET(createRequest())
    expect(res.status).toBe(401)
  })

  it('should return empty events when no children', async () => {
    mockGetSession.mockResolvedValue(createParentSession())
    mockQuery.mockResolvedValueOnce([]) // children query

    const res = await GET(createRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.events).toHaveLength(0)
    expect(body.children).toHaveLength(0)
  })

  it('should return calendar events for children', async () => {
    mockGetSession.mockResolvedValue(createParentSession())

    mockQuery
      // children
      .mockResolvedValueOnce([{ child_id: 'child-1', name: 'Ahmed' }])
      // sessions
      .mockResolvedValueOnce([
        {
          id: 's1',
          title: 'Quran Session',
          course_id: 'c1',
          scheduled_at: '2025-06-15T10:00:00Z',
          meeting_link: 'https://meet.example.com/abc',
          status: 'confirmed',
          course_title: 'Quran Level 1',
          student_id: 'child-1',
        },
      ])
      // tasks
      .mockResolvedValueOnce([])
      // bookings
      .mockResolvedValueOnce([])

    const res = await GET(createRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.events).toHaveLength(1)
    expect(body.events[0].type).toBe('live_session')
    expect(body.events[0].child_name).toBe('Ahmed')
    expect(body.children).toHaveLength(1)
  })

  it('should filter by child_id', async () => {
    mockGetSession.mockResolvedValue(createParentSession())

    mockQuery
      .mockResolvedValueOnce([{ child_id: 'child-2', name: 'Sara' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const res = await GET(createRequest('http://localhost/api/academy/parent/calendar/events?child=child-2'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.children[0].id).toBe('child-2')
  })

  it('should include task deadlines', async () => {
    mockGetSession.mockResolvedValue(createParentSession())

    mockQuery
      .mockResolvedValueOnce([{ child_id: 'child-1', name: 'Ahmed' }])
      .mockResolvedValueOnce([]) // sessions
      .mockResolvedValueOnce([
        {
          id: 't1',
          title: 'Homework Assignment',
          course_id: 'c1',
          due_date: '2025-06-20T23:59:59Z',
          course_title: 'Quran Level 1',
          student_id: 'child-1',
        },
      ]) // tasks
      .mockResolvedValueOnce([]) // bookings

    const res = await GET(createRequest())
    const body = await res.json()

    expect(body.events).toHaveLength(1)
    expect(body.events[0].type).toBe('assignment_deadline')
  })

  it('should include reader bookings', async () => {
    mockGetSession.mockResolvedValue(createParentSession())

    mockQuery
      .mockResolvedValueOnce([{ child_id: 'child-1', name: 'Ahmed' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'b1',
          scheduled_at: '2025-06-18T14:00:00Z',
          status: 'confirmed',
          meeting_link: 'https://meet.example.com/xyz',
          student_id: 'child-1',
          reader_name: 'Sheikh Ali',
        },
      ])

    const res = await GET(createRequest())
    const body = await res.json()

    expect(body.events).toHaveLength(1)
    expect(body.events[0].type).toBe('booking')
    expect(body.events[0].course).toContain('Sheikh Ali')
  })
})
