'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/context/CRMContext';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, authReady } = useCRM();
  const router = useRouter();

   useEffect(() => {
    if (authReady && !user) {
      window.location.href = 'https://www.itsoftlab360.com/login';
    }
  }, [authReady, user, router]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}