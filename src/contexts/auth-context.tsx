
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import type { UserCredentials } from '@/types';
import { getStoredUsers, saveStoredUsers } from '@/lib/mock-data';

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
    // getStoredUsers from mock-data.ts already handles setting default users if localStorage is empty
    getStoredUsers(); 

    try {
      const storedUser = localStorage.getItem('agendaMedicaUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error reading user from localStorage", error);
      localStorage.removeItem('agendaMedicaUser'); // Clear corrupted data
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate short delay

    const users = getStoredUsers();
    const foundUser = users.find(u => u.username === username && u.password_plaintext === password);

    if (foundUser) {
      // Ensure the user object stored contains all necessary fields, especially 'id' and 'password_plaintext' for consistency
      const userData: UserCredentials = { 
        id: foundUser.id, 
        username: foundUser.username,
        password_plaintext: foundUser.password_plaintext // Storing plaintext for mock/localStorage
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
    
    // Also update the user in the main list of users stored in localStorage
    const allUsers = getStoredUsers();
    const userIndex = allUsers.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      allUsers[userIndex] = updatedUser;
      saveStoredUsers(allUsers);
    }
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
