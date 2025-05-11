
"use client";

import type { UserCredentials } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FilePenLine, Trash2, ShieldCheck, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';

interface UserListProps {
  users: UserCredentials[];
  onEditUser: (user: UserCredentials) => void;
  onDeleteUser: (userId: string) => void;
}

export default function UserList({ users, onEditUser, onDeleteUser }: UserListProps) {
  const { user: currentUser } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserCredentials | null>(null);


  const handleDeleteClick = (user: UserCredentials) => {
    if (user.username === 'admin') {
      toast({
        title: "Acción no permitida",
        description: "El usuario administrador no puede ser eliminado.",
        variant: "destructive",
      });
      return;
    }
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
      toast({
        title: "Usuario Eliminado",
        description: `El usuario ${userToDelete.username} ha sido eliminado.`,
      });
    }
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  if (users.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No hay usuarios registrados.</p>;
  }

  return (
    <>
      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Nombre de Usuario</TableHead>
              <TableHead className="w-[150px]">Rol</TableHead>
              <TableHead className="text-right w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  {user.username === 'admin' ? (
                    <Badge variant="default"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Administrador</Badge>
                  ) : (
                    <Badge variant="secondary"><User className="mr-1.5 h-3.5 w-3.5" />Usuario</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditUser(user)}>
                        <FilePenLine className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      {user.username !== 'admin' && currentUser?.username !== user.username && ( // Admin cannot delete self
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(user)} 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      
      {userToDelete && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario <span className="font-semibold">{userToDelete.username}</span>.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    onClick={confirmDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                    Sí, eliminar
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
