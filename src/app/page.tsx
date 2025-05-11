"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import Spinner from '@/components/ui/spinner';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/dashboard/calendario');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex h-screen min-h-screen w-full flex-col items-center justify-center bg-background">
      <Spinner size="lg" />
      <p className="mt-4 text-muted-foreground">Cargando aplicación...</p>
    </div>
  );
}
