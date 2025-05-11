"use client";

import type { Patient } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FilePenLine, Trash2, Eye, ShieldCheck, Droplets } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


interface PatientListProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (patientId: string) => void;
}

export default function PatientList({ patients, onEdit, onDelete }: PatientListProps) {
  const router = useRouter();

  const handleDeleteConfirm = (patientId: string) => {
    onDelete(patientId);
    toast({
      title: "Paciente Eliminado",
      description: "El paciente ha sido eliminado exitosamente.",
    });
  };

  const handleViewHistory = (patientId: string) => {
    router.push(`/dashboard/historiales?patientId=${patientId}`);
  };

  if (patients.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No hay pacientes registrados.</p>;
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Nombre Completo</TableHead>
            <TableHead className="w-[100px]">DNI</TableHead>
            <TableHead className="w-[80px]">Edad</TableHead>
            <TableHead className="w-[100px]">Sexo</TableHead>
            <TableHead className="w-[100px]">Tipo Sangre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead className="text-right w-[80px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-medium">{`${patient.firstName} ${patient.lastName}`}</TableCell>
              <TableCell>{patient.dni}</TableCell>
              <TableCell>{patient.age}</TableCell>
              <TableCell>
                <Badge variant={patient.gender === 'femenino' ? 'secondary' : patient.gender === 'masculino' ? 'default' : 'outline'} className="capitalize">
                  {patient.gender}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize flex items-center gap-1">
                  <Droplets size={12}/> {patient.bloodType}
                </Badge>
              </TableCell>
              <TableCell>{patient.email}</TableCell>
              <TableCell>{patient.phone}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewHistory(patient.id)}>
                      <Eye className="mr-2 h-4 w-4" /> Ver Historial
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(patient)}>
                      <FilePenLine className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente al paciente y sus datos asociados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteConfirm(patient.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Sí, eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
      {patients.length > 5 && <TableCaption>Mostrando {patients.length} pacientes.</TableCaption>}
    </ScrollArea>
  );
}
