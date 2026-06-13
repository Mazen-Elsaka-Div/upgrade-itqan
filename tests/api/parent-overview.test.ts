import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/academy/parent/overview/route'

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  queryOne: vi.fn(),
  query: vi.fn(),
}))

import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'

const mockGetSession = vi.mocked(getSession)
const mockQueryOne = vi.mocked(queryOne)

function createRequest() {
  return new Request('http://localhost/api/academy/parent/overview')
}

describe('/api/academy/parent/overview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('should return 401 when role is not parent', async () => {
    mockGetSession.mockResolvedValue({
      sub: 'user-1',
      email: 'test@example.com',
      role: 'student',
      name: 'Test',
      iat: Date.now(),
      exp: Date.now() + 86400000,
    })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('should return dashboard overview for parent', async () => {
    mockGetSession.mockResolvedValue({
      sub: 'parent-1',
      email: 'parent@test.com',
      role: 'parent',
      name: 'Parent User',
      iat: Date.now(),
      exp: Date.now() + 86400000,
    })

    const overviewData = {
      parent: { id: 'parent-1', name: 'Parent User', email: 'parent@test.com', avatar_url: null },
      summary: { total_children: 2, pending_requests: 1, rejected_links: 0, active_count: 1 },
      children: [
        {
          link_id: 'link-1',
          child_id: 'child-1',
          child_name: 'Child One',
          child_avatar: null,
          relation: 'father',
          linked_at: '2024-01-01',
          enrollments: { total: 3, active: 2, completed: 1, avg_progress: 65 },
          recitations: { total_30d: 15, last_at: '2024-06-01' },
          bookings: { upcoming: 2 },
          weekly_activity: { recitations: 10, bookings: 3 },
          badges: { total: 5 },
        },
      ],
    }

    mockQueryOne.mockResolvedValue({ get_parent_dashboard_overview: overviewData })

    const res = await GET()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.parent.name).toBe('Parent User')
    expect(body.summary.total_children).toBe(2)
    expect(body.children).toHaveLength(1)
    expect(body.children[0].child_name).toBe('Child One')
  })

  it('should return 500 on database error', async () => {
    mockGetSession.mockResolvedValue({
      sub: 'parent-1',
      email: 'parent@test.com',
      role: 'parent',
      name: 'Parent',
      iat: Date.now(),
      exp: Date.now() + 86400000,
    })
    mockQueryOne.mockRejectedValue(new Error('DB connection failed'))

    const res = await GET()
    expect(res.status).toBe(500)
  })
})
