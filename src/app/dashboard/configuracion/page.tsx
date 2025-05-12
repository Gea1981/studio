
"use client";

import { useState, useEffect, Suspense } from 'react';
import UserList from '@/components/configuracion/user-list';
import UserFormModal from '@/components/configuracion/user-form-modal';
import type { UserCredentials } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { getStoredUsers, saveStoredUsers, getNextUserId } from '@/lib/mock-data';
import { PlusCircle, Users } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context'; 

function ConfiguracionPageContent() {
  const [users, setUsers] = useState<UserCredentials[]>([]);
  const [editingUser, setEditingUser] = useState<UserCredentials | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user: currentUser, updateCurrentUser } = useAuth();

  useEffect(() => {
    setUsers(getStoredUsers());
  }, []);

  const handleOpenModalForCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (user: UserCredentials) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmitUser = (userData: UserCredentials, originalId?: string) => {
    let updatedUsers;
    let userToUpdateInAuthContext: UserCredentials | null = null;

    if (originalId) { // Editing existing user
      updatedUsers = users.map(u => 
        u.id === originalId ? { ...userData, id: originalId } : u // userData already contains the full new state
      );
      if (currentUser && currentUser.id === originalId) {
        userToUpdateInAuthContext = updatedUsers.find(u => u.id === originalId) || null;
      }
    } else { // Creating new user
      const newUserWithId = { ...userData, id: getNextUserId() };
      updatedUsers = [newUserWithId, ...users];
    }
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);
    
    if (userToUpdateInAuthContext) {
        updateCurrentUser(userToUpdateInAuthContext);
    }

    handleCloseModal();
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete && userToDelete.username === 'admin') {
        // This should be prevented by UI logic in UserList, but as a safeguard.
        return; 
    }
    if (currentUser && currentUser.id === userId) {
        // Prevent deleting self - UserList should also prevent this.
        return;
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2"><Users size={24} className="text-primary"/> Gestión de Usuarios</CardTitle>
            <CardDescription>Administra los usuarios del sistema.</CardDescription>
          </div>
          {currentUser?.username === 'admin' && ( // Only admin can create new users
            <Button onClick={handleOpenModalForCreate} className="shadow">
                <PlusCircle size={18} className="mr-2" /> Crear Nuevo Usuario
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <UserList 
            users={users} 
            onEditUser={handleOpenModalForEdit} 
            onDeleteUser={handleDeleteUser} 
          />
        </CardContent>
      </Card>

      {isModalOpen && (
        <UserFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmitUser={handleSubmitUser}
          editingUser={editingUser}
          allUsers={users}
        />
      )}
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-64">
        <Spinner size="lg"/>
        <p className="mt-2 text-muted-foreground">Cargando configuración...</p>
      </div>
    }>
      <ConfiguracionPageContent />
    </Suspense>
  );
}
