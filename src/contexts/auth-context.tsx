"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: { username: string } | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded credentials for simplicity
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password"; // In a real app, NEVER do this.

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('agendaMedicaUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error reading user from localStorage", error);
      localStorage.removeItem('agendaMedicaUser');
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const userData = { username };
      setUser(userData);
      localStorage.setItem('agendaMedicaUser', JSON.stringify(userData));
      setIsLoading(false);
      router.push('/dashboard/resumen'); // Updated redirect
      toast({ title: "Inicio de sesión exitoso", description: "Bienvenido, administrador." });
      return true;
    } else {
      setIsLoading(false);
      toast({ title: "Error de inicio de sesión", description: "Usuario o contraseña incorrectos.", variant: "destructive" });
      return false;
    }
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('agendaMedicaUser');
    router.push('/login');
    toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente." });
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
