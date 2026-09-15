"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import type { Orcamento } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AcoesOrcamentoProps {
  orcamento: Orcamento;
  isBusy?: boolean;
  onCorrigir: (valorUnitario: number) => Promise<void>;
  onApagar: () => Promise<void>;
}

export function AcoesOrcamento({
  orcamento,
  isBusy = false,
  onCorrigir,
  onApagar,
}: AcoesOrcamentoProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [valorUnitario, setValorUnitario] = useState(
    String(orcamento.valorUnitario),
  );
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleEditOpenChange = (nextOpen: boolean) => {
    if (isBusy && nextOpen) {
      return;
    }

    setEditOpen(nextOpen);

    if (nextOpen) {
      setValorUnitario(String(orcamento.valorUnitario));
      setEditError(null);
    }
  };

  const handleDeleteOpenChange = (nextOpen: boolean) => {
    if (isBusy && nextOpen) {
      return;
    }

    setDeleteOpen(nextOpen);

    if (nextOpen) {
      setDeleteError(null);
    }
  };

  const handleCorrigir = async () => {
    const valor = Number(valorUnitario.replace(",", "."));

    if (Number.isNaN(valor) || valor <= 0) {
      setEditError(
        "Informe um valor unitário maior que zero.",
      );
      return;
    }

    setEditError(null);

    try {
      await onCorrigir(valor);
      setEditOpen(false);
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "Erro ao corrigir orçamento.",
      );
    }
  };

  const handleApagar = async () => {
    setDeleteError(null);

    try {
      await onApagar();
      setDeleteOpen(false);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Erro ao apagar orçamento.",
      );
    }
  };

  return (
    <div className="flex justify-end gap-1">
      <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={isBusy}
            aria-label={`Corrigir valor de ${orcamento.fornecedorNome}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corrigir valor</DialogTitle>

            <DialogDescription>
              Altere só o valor unitário de{" "}
              {orcamento.fornecedorNome}. O fornecedor não muda.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`corrigir-orcamento-${orcamento.id}`}>
                Valor unitário
              </FieldLabel>

              <Input
                id={`corrigir-orcamento-${orcamento.id}`}
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                placeholder="0,00"
                value={valorUnitario}
                onChange={(event) =>
                  setValorUnitario(event.target.value)
                }
                disabled={isBusy}
              />
            </Field>
          </FieldGroup>

          {editError && (
            <Alert variant="destructive">
              <AlertDescription>
                {editError}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleEditOpenChange(false)}
              disabled={isBusy}
            >
              Cancelar
            </Button>

            <Button
              onClick={() => void handleCorrigir()}
              disabled={isBusy || !valorUnitario}
            >
              {isBusy ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={isBusy}
            className="text-destructive hover:text-destructive"
            aria-label={`Apagar orçamento de ${orcamento.fornecedorNome}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Apagar orçamento?
            </AlertDialogTitle>

            <AlertDialogDescription>
              O lançamento de {orcamento.fornecedorNome} sai da
              comparação deste item.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>
                {deleteError}
              </AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>
              Cancelar
            </AlertDialogCancel>

            <Button
              variant="destructive"
              onClick={() => void handleApagar()}
              disabled={isBusy}
            >
              {isBusy ? "Apagando..." : "Apagar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
