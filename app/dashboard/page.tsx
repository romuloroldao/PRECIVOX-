import { redirect } from 'next/navigation';
import { getServerSessionUser } from '@/lib/api-auth';
import { getDashboardUrl } from '@/lib/redirect';

export default async function DashboardRedirectPage() {
  const user = await getServerSessionUser();
  const role = user?.role;

  if (role === 'ADMIN' || role === 'GESTOR' || role === 'CLIENTE') {
    redirect(getDashboardUrl(role));
  }

  redirect('/login');
}
