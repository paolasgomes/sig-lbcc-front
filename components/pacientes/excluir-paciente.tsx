"use client";

import { useState } from "react";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { inativarPaciente } from "@/services/pacientes-service";

interface ExcluirPacienteProps {
  pacienteId: string;
  pacienteNome: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ExcluirPaciente({
  pacienteId,
  pacienteNome,
  open,
  onOpenChange,
}: ExcluirPacienteProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isControlled = typeof open === "boolean";
  const currentOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => undefined)) : setInternalOpen;

  const deletePacienteMutation = useMutation({
    mutationFn: () => inativarPaciente(pacienteId),
    onSuccess: async () => {
      queryClient.setQueryData<{ id: string }[]>(["pacientes"], (current) => {
        if (!current) return current;
        return current.filter((paciente) => paciente.id !== pacienteId);
      });

      await queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    },
  });

  const handleConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deletePacienteMutation.mutateAsync();
      setOpen(false);
      router.push("/pacientes");
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Erro ao excluir paciente.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={currentOpen} onOpenChange={setOpen}>
      {!isControlled && (
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir paciente</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o paciente {pacienteNome}? Esta ação não pode
            ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deleteError && (
          <Alert variant="destructive">
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isDeleting ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
