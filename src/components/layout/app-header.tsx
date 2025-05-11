"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith('/dashboard/calendario')) return 'Calendario de Citas';
  if (pathname.startsWith('/dashboard/pacientes')) return 'Gestión de Pacientes';
  if (pathname.startsWith('/dashboard/historiales')) return 'Historiales Médicos';
  return 'Dashboard';
};

export default function AppHeader() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-6 shadow-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" /> {/* Only show on mobile, sidebar is fixed on desktop */}
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>
      {/* Placeholder for potential header actions like notifications or user profile dropdown */}
      {/* 
      <Button variant="ghost" size="icon" onClick={logout} aria-label="Cerrar sesión">
        <LogOut className="h-5 w-5" />
      </Button>
      */}
    </header>
  );
}
