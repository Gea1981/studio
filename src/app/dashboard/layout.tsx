"use client";

import type { ReactNode } from 'react';
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/layout/app-sidebar";
import AppHeader from "@/components/layout/app-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Spinner from "@/components/ui/spinner";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen min-h-screen w-full flex-col items-center justify-center bg-background">
        <Spinner size="lg" />
        <p className="mt-4 text-muted-foreground">Verificando sesión...</p>
      </div>
    );
  }

  if (!user) {
    // This state should ideally be brief due to the redirect.
    // You might want to return null or a minimal message if the redirect is slow.
    return null; 
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6 bg-secondary/50">
            <div className="container mx-auto max-w-7xl">
             {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
