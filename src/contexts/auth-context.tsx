
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import type { UserCredentials } from '@/types';
import { getStoredUsers, saveStoredUsers } from '@/lib/mock-data'; // Assuming saveStoredUsers might be needed if users could register themselves.

interface AuthContextType {
  user: UserCredentials | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateCurrentUser: (updatedUser: UserCredentials) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Initialize users if not already present (e.g., first run)
    const users = getStoredUsers();
    if (users.length === 0) { // This ensures default users are set up if localStorage is empty
        // This will save the defaultUsers array (containing admin) to localStorage
        // The getStoredUsers already handles setting default if key not found.
        // No explicit save is needed here unless we want to force overwrite, which is not the goal.
    }

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
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    const users = getStoredUsers();
    const foundUser = users.find(u => u.username === username);

    if (foundUser && foundUser.password_plaintext === password) {
      const userData: UserCredentials = { 
        id: foundUser.id, 
        username: foundUser.username,
        password_plaintext: foundUser.password_plaintext // Store for mock purposes, IRL don't store plaintext
      };
      setUser(userData);
      localStorage.setItem('agendaMedicaUser', JSON.stringify(userData));
      setIsLoading(false);
      router.push('/dashboard/resumen');
      toast({ title: "Inicio de sesión exitoso", description: `Bienvenido, ${foundUser.username}.` });
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

  const updateCurrentUser = useCallback((updatedUser: UserCredentials) => {
    setUser(updatedUser);
    localStorage.setItem('agendaMedicaUser', JSON.stringify(updatedUser));
    // Potentially update the list of all users in localStorage if password changed here
    // For this app structure, it's better to handle updating the full user list in the configuracion page
  }, []);


  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateCurrentUser }}>
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
