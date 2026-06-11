import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDashboardUrl } from '@/lib/redirect';

export default async function DashboardRedirectPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role === 'ADMIN' || role === 'GESTOR' || role === 'CLIENTE') {
    redirect(getDashboardUrl(role));
  }

  redirect('/login');
}
