import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import IntegrationsDashboard from '@/components/admin/integrations-dashboard'

export default async function IntegrationsPage() {
  const session = await getSession()
  const isSuperAdmin = session?.role === 'admin' || (session?.role as string) === 'super_admin'
  if (!isSuperAdmin) redirect('/admin')

  return <IntegrationsDashboard />
}
