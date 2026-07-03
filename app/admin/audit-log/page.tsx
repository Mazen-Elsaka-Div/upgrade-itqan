import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import UnifiedAuditLog from '@/components/admin/unified-audit-log'

export default async function AuditLogPage() {
  const session = await getSession()
  const isSuperAdmin = session?.role === 'admin' || session?.role === 'super_admin'
  if (!isSuperAdmin) redirect('/admin')

  return <UnifiedAuditLog />
}
