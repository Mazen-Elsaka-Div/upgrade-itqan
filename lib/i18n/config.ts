import { Home, BookOpen, Users, Settings, BarChart3, FileText, MessageSquare, Globe, Phone } from 'lucide-react'
import type { Translations } from './context'

export function getRoleConfig(t: Translations) {
  return {
    admin: {
      label: 'Admin Dashboard',
      name: t.shell.generalSupervisor,
      sublabel: 'System Administrator',
      sections: [
        {
          title: '',
          items: [
            { label: t.shell.studentPortal, href: '/admin', icon: Home },
            { label: (t as any).addedTranslations_2026?.['التلاوات'] || 'التلاوات', href: '/admin/recitations', icon: BookOpen },
            { label: t.shell.certifiedReader, href: '/admin/readers', icon: Users },
            { label: t.shell.settings, href: '/admin/settings', icon: Settings },
            { label: t.shell.reports, href: '/admin/reports', icon: BarChart3 },
          ]
        },
        {
          title: t.shell.generalSupervisor,
          items: [
            { label: t.shell.users, href: '/admin/users', icon: Users },
            { label: (t as any).addedTranslations_2026?.['الإعلانات'] || 'الإعلانات', href: '/admin/announcements', icon: FileText },
            { label: t.shell.conversations, href: '/admin/conversations', icon: MessageSquare },
          ]
        },
        {
          title: t.shell.account,
          items: [
            { label: t.shell.account, href: '/admin/profile', icon: Settings },
          ]
        }
      ]
    },
    reader: {
      label: 'Reader Dashboard',
      name: t.shell.certifiedReader,
      sublabel: 'Certified Reader',
      sections: [
        {
          title: '',
          items: [
            { label: (t as any).addedTranslations_2026?.['التلاوات'] || 'التلاوات', href: '/reader/recitations', icon: BookOpen },
            { label: (t as any).addedTranslations_2026?.['الجلسات'] || 'الجلسات', href: '/reader/sessions', icon: MessageSquare },
            { label: t.shell.settings, href: '/reader/settings', icon: Settings },
            { label: t.shell.reports, href: '/reader/reports', icon: BarChart3 },
          ]
        },
        {
          title: t.shell.account,
          items: [
            { label: t.shell.account, href: '/reader/profile', icon: Settings },
          ]
        }
      ]
    },
    student: {
      label: 'Student Dashboard',
      name: t.shell.studentPortal,
      sublabel: t.shell.studentLevel,
      sections: [
        {
          title: '',
          items: [
            { label: (t as any).addedTranslations_2026?.['التلاوات'] || 'التلاوات', href: '/student/recitations', icon: BookOpen },
            { label: (t as any).addedTranslations_2026?.['الجلسات'] || 'الجلسات', href: '/student/sessions', icon: MessageSquare },
            { label: t.shell.settings, href: '/student/settings', icon: Settings },
            { label: t.shell.statsAndReports, href: '/student/stats', icon: BarChart3 },
          ]
        },
        {
          title: t.shell.account,
          items: [
            { label: t.shell.account, href: '/student/profile', icon: Settings },
          ]
        }
      ]
    }
  }
}
