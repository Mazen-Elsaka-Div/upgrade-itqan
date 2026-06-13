import { describe, it, expect, vi } from 'vitest'
import { requireRole, hasAcademyRole, getAcademyRole, type AllRoles } from '@/lib/auth'

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn() }),
}))

describe('auth helpers', () => {
  const mockSession = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'parent' as AllRoles,
    name: 'Test Parent',
    iat: Date.now(),
    exp: Date.now() + 86400000,
  }

  describe('requireRole', () => {
    it('should return true when session has required role', () => {
      expect(requireRole(mockSession, ['parent'])).toBe(true)
    })

    it('should return false when session has wrong role', () => {
      expect(requireRole(mockSession, ['admin'])).toBe(false)
    })

    it('should return false when session is null', () => {
      expect(requireRole(null, ['parent'])).toBe(false)
    })

    it('should return true when session role is in array of roles', () => {
      expect(requireRole(mockSession, ['admin', 'parent', 'teacher'])).toBe(true)
    })
  })

  describe('hasAcademyRole', () => {
    it('should return true when session role matches', () => {
      expect(hasAcademyRole(mockSession, ['parent'])).toBe(true)
    })

    it('should return true when academy_roles contains a match', () => {
      const sessionWithAcademyRoles = {
        ...mockSession,
        academy_roles: ['teacher', 'admin'],
      }
      expect(hasAcademyRole(sessionWithAcademyRoles, ['admin'])).toBe(true)
    })

    it('should return false when no roles match', () => {
      const sessionWithAcademyRoles = {
        ...mockSession,
        academy_roles: ['teacher'],
      }
      expect(hasAcademyRole(sessionWithAcademyRoles, ['student'])).toBe(false)
    })

    it('should return false when session is null', () => {
      expect(hasAcademyRole(null, ['parent'])).toBe(false)
    })
  })

  describe('getAcademyRole', () => {
    it('should return parent for parent role', () => {
      expect(getAcademyRole(mockSession)).toBe('parent')
    })

    it('should return teacher for teacher role', () => {
      expect(getAcademyRole({ ...mockSession, role: 'teacher' })).toBe('teacher')
    })

    it('should return academy_admin for academy_admin role', () => {
      expect(getAcademyRole({ ...mockSession, role: 'academy_admin' })).toBe('academy_admin')
    })

    it('should return first academy_role when academy_roles exist', () => {
      const studentSession = {
        ...mockSession,
        role: 'student' as AllRoles,
        academy_roles: ['teacher', 'admin'],
      }
      expect(getAcademyRole(studentSession)).toBe('teacher')
    })

    it('should return academy_student for student without academy_roles', () => {
      const studentSession = {
        ...mockSession,
        role: 'student' as AllRoles,
      }
      expect(getAcademyRole(studentSession)).toBe('academy_student')
    })

    it('should return first academy_role for other roles', () => {
      const session = {
        ...mockSession,
        role: 'admin' as AllRoles,
        academy_roles: ['content_supervisor'],
      }
      expect(getAcademyRole(session)).toBe('content_supervisor')
    })

    it('should return null when session is null', () => {
      expect(getAcademyRole(null)).toBeNull()
    })

    it('should return null for unknown role without academy_roles', () => {
      const session = {
        ...mockSession,
        role: 'admin' as AllRoles,
      }
      expect(getAcademyRole(session)).toBeNull()
    })
  })
})
