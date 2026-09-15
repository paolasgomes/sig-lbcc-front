"use client";

import { useMemo, useState } from "react";

import { useFornecedores } from "@/hooks/use-fornecedores";

import type { OrcamentoBlocoInput } from "@/types";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LancarOrcamentoModalProps {
  itemDescricao: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  onSubmit: (bloco: OrcamentoBlocoInput) => Promise<void>;
}

export function LancarOrcamentoModal({
  itemDescricao,
  disabled = false,
  isSubmitting = false,
  onSubmit,
}: LancarOrcamentoModalProps) {
  const { fornecedores, isLoading } = useFornecedores();

  const [open, setOpen] = useState(false);
  const [fornecedorId, setFornecedorId] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fornecedoresAtivos = useMemo(
    () => fornecedores.filter((fornecedor) => fornecedor.ativo),
    [fornecedores],
  );

  const resetForm = () => {
    setFornecedorId("");
    setValorUnitario("");
    setSubmitError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (disabled) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  };

  const handleConfirm = async () => {
    const valor = Number(
      valorUnitario.replace(",", "."),
    );

    if (!fornecedorId || Number.isNaN(valor) || valor <= 0) {
      setSubmitError(
        "Informe um fornecedor ativo e um valor unitário maior que zero.",
      );
      return;
    }

    setSubmitError(null);

    try {
      await onSubmit({
        fornecedorId,
        valorUnitario: valor,
      });

      setOpen(false);
      resetForm();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Erro ao registrar orçamento.",
      );
    }
  };

  if (disabled) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Lançar orçamento
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lançar orçamento</DialogTitle>

          <DialogDescription>
            Informe o fornecedor e o valor unitário para{" "}
            {itemDescricao}.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="orcamento-fornecedor">
              Fornecedor
            </FieldLabel>

            <Select
              value={fornecedorId}
              onValueChange={setFornecedorId}
              disabled={isLoading || isSubmitting}
            >
              <SelectTrigger id="orcamento-fornecedor">
                <SelectValue placeholder="Selecione um fornecedor ativo" />
              </SelectTrigger>

              <SelectContent>
                {fornecedoresAtivos.map((fornecedor) => (
                  <SelectItem
                    key={fornecedor.id}
                    value={fornecedor.id}
                  >
                    {fornecedor.nomeFantasia ||
                      fornecedor.razaoSocial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="orcamento-valor">
              Valor unitário
            </FieldLabel>

            <Input
              id="orcamento-valor"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="0,00"
              value={valorUnitario}
              onChange={(event) =>
                setValorUnitario(event.target.value)
              }
              disabled={isSubmitting}
            />
          </Field>
        </FieldGroup>

        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>
              {submitError}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <Button
            onClick={() => void handleConfirm()}
            disabled={
              isSubmitting ||
              !fornecedorId ||
              !valorUnitario
            }
          >
            {isSubmitting ? "Salvando..." : "Lançar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
