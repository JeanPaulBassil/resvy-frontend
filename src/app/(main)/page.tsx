'use client';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Redirect admin users to clients page
      if (userRole === 'ADMIN') {
        router.replace('/admin/clients');
      } else {
        // Redirect regular users to dashboard
        router.replace('/dashboard');
      }
    }
  }, [user, userRole, router]);

  return (
    <div>
      <h1>{user?.email || 'No user'}</h1>
    </div>
  );
}
