"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { Atom, LayoutDashboard, CalendarDays, UsersRound, ClipboardList, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard/resumen', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/dashboard/pacientes', label: 'Pacientes', icon: UsersRound },
  { href: '/dashboard/historiales', label: 'Historiales Médicos', icon: ClipboardList },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <Link href="/dashboard/resumen" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <Atom className="h-8 w-8 text-primary" />
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">Agenda Médica</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{children: item.label, side: 'right', align: 'center'}}
                  className="justify-start"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t">
         {user && (
            <div className="p-2 group-data-[collapsible=icon]:hidden text-sm">
                <p className="font-semibold text-foreground">{user.username}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
        )}
        <Button 
            variant="ghost" 
            className="w-full justify-start group-data-[collapsible=icon]:justify-center"
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
        >
            <LogOut className="h-5 w-5" />
            <span className="group-data-[collapsible=icon]:hidden ml-2">Cerrar Sesión</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
