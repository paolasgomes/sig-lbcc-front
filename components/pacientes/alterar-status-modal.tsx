"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { usePaciente } from "@/hooks/use-pacientes";
import { StatusPaciente } from "@/types";

interface AlterarStatusModalProps {
  pacienteId: string;
  statusAtual: StatusPaciente;
}

const statusOptions = [
  { value: StatusPaciente.ATIVO, label: "Ativo" },
  { value: StatusPaciente.SUSPENSO, label: "Suspenso" },
  { value: StatusPaciente.ENCERRADO, label: "Encerrado" },
];

export function AlterarStatusModal({ pacienteId, statusAtual }: AlterarStatusModalProps) {
  const { alterarStatus, isAlterandoStatus } = usePaciente(pacienteId);
  const [open, setOpen] = useState(false);
  const [novoStatus, setNovoStatus] = useState<StatusPaciente>(statusAtual);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (novoStatus !== statusAtual) {
      setSubmitError(null);

      try {
        await alterarStatus(novoStatus);
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Erro ao alterar status do paciente.",
        );
        return;
      }
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Alterar Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Status do Paciente</DialogTitle>
          <DialogDescription>
            Selecione o novo status para o paciente. Esta ação será registrada no
            histórico.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="status">Novo Status</FieldLabel>
            <Select
              value={novoStatus}
              onValueChange={(v) => setNovoStatus(v as StatusPaciente)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isAlterandoStatus}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={novoStatus === statusAtual || isAlterandoStatus}
          >
            {isAlterandoStatus ? "Salvando..." : "Confirmar Alteração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
