
import { getSession } from '@/lib/auth';
import Dashboard from './components/Dashboard';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Dashboard role={session.role} />
    </main>
  );
}
