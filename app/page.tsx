import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { HomeLanding } from '@/components/home-landing';

export default async function HomePage() {
  const session = await auth();

  // Authenticated users go straight to /sheet
  if (session?.user) {
    redirect('/sheet');
  }

  return <HomeLanding />;
}
