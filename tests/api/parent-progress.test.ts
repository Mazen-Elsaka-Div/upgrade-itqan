import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/academy/parent/progress/route'

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}))

import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const mockGetSession = vi.mocked(getSession)
const mockQuery = vi.mocked(query)

function createRequest() {
  return new Request('http://localhost/api/academy/parent/progress') as any
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

describe('/api/academy/parent/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET(createRequest())
    expect(res.status).toBe(401)
  })

  it('should return 401 when role is not parent or admin', async () => {
    mockGetSession.mockResolvedValue({
      ...createParentSession(),
      role: 'student',
    } as any)
    const res = await GET(createRequest())
    expect(res.status).toBe(401)
  })

  it('should return progress data for parent', async () => {
    mockGetSession.mockResolvedValue(createParentSession())

    // children query
    mockQuery
      .mockResolvedValueOnce([{ child_id: 'child-1', child_name: 'Ahmed' }])
      // courses query
      .mockResolvedValueOnce([
        { course_id: 'c1', name: 'Quran Level 1', status: 'active', progress: 75 },
        { course_id: 'c2', name: 'Tajweed Basics', status: 'active', progress: 45 },
      ])
      // weekly activity query
      .mockResolvedValueOnce([
        { day_offset: 0, count: 3 },
        { day_offset: 1, count: 2 },
        { day_offset: 2, count: 1 },
        { day_offset: 3, count: 0 },
        { day_offset: 4, count: 4 },
        { day_offset: 5, count: 1 },
        { day_offset: 6, count: 2 },
      ])

    const res = await GET(createRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].id).toBe('child-1')
    expect(body[0].name).toBe('Ahmed')
    expect(body[0].overallProgress).toBe(60) // (75+45)/2
    expect(body[0].courses).toHaveLength(2)
    expect(body[0].weeklyActivity).toHaveLength(7)
  })

  it('should handle parent with no children', async () => {
    mockGetSession.mockResolvedValue(createParentSession())
    mockQuery.mockResolvedValueOnce([]) // no children

    const res = await GET(createRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveLength(0)
  })

  it('should allow admin role', async () => {
    mockGetSession.mockResolvedValue({
      ...createParentSession(),
      role: 'admin',
    } as any)
    mockQuery.mockResolvedValueOnce([])

    const res = await GET(createRequest())
    expect(res.status).toBe(200)
  })
})
