"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

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

interface BlocoForm {
  key: number;
  fornecedorId: string;
  valorUnitario: string;
}

interface LancarOrcamentoModalProps {
  itemDescricao: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  fornecedorIdsNoItem?: string[];
  onSubmit: (blocos: OrcamentoBlocoInput[]) => Promise<void>;
}

function blocoVazio(key: number): BlocoForm {
  return {
    key,
    fornecedorId: "",
    valorUnitario: "",
  };
}

export function LancarOrcamentoModal({
  itemDescricao,
  disabled = false,
  isSubmitting = false,
  fornecedorIdsNoItem = [],
  onSubmit,
}: LancarOrcamentoModalProps) {
  const { fornecedores, isLoading } = useFornecedores();
  const proximaChave = useRef(1);

  const [open, setOpen] = useState(false);
  const [blocos, setBlocos] = useState<BlocoForm[]>([blocoVazio(0)]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fornecedoresAtivos = useMemo(
    () => fornecedores.filter((fornecedor) => fornecedor.ativo),
    [fornecedores],
  );

  const idsJaNoItem = useMemo(
    () => new Set(fornecedorIdsNoItem),
    [fornecedorIdsNoItem],
  );

  const resetForm = () => {
    proximaChave.current = 1;
    setBlocos([blocoVazio(0)]);
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

  const atualizarBloco = (
    key: number,
    campo: "fornecedorId" | "valorUnitario",
    valor: string,
  ) => {
    setBlocos((atuais) =>
      atuais.map((bloco) =>
        bloco.key === key ? { ...bloco, [campo]: valor } : bloco,
      ),
    );
  };

  const adicionarBloco = () => {
    const key = proximaChave.current;
    proximaChave.current += 1;
    setBlocos((atuais) => [...atuais, blocoVazio(key)]);
  };

  const removerBloco = (key: number) => {
    setBlocos((atuais) =>
      atuais.length <= 1
        ? atuais
        : atuais.filter((bloco) => bloco.key !== key),
    );
  };

  const fornecedoresDoBloco = (bloco: BlocoForm) => {
    const idsOutrosBlocos = new Set(
      blocos
        .filter((outro) => outro.key !== bloco.key && outro.fornecedorId)
        .map((outro) => outro.fornecedorId),
    );

    return fornecedoresAtivos.filter((fornecedor) => {
      if (fornecedor.id === bloco.fornecedorId) {
        return true;
      }

      if (idsJaNoItem.has(fornecedor.id)) {
        return false;
      }

      return !idsOutrosBlocos.has(fornecedor.id);
    });
  };

  const idsReservados = useMemo(() => {
    const ids = new Set(idsJaNoItem);

    for (const bloco of blocos) {
      if (bloco.fornecedorId) {
        ids.add(bloco.fornecedorId);
      }
    }

    return ids;
  }, [blocos, idsJaNoItem]);

  const podeAdicionarBloco = fornecedoresAtivos.some(
    (fornecedor) => !idsReservados.has(fornecedor.id),
  );

  const blocosIncompletos = blocos.some(
    (bloco) => !bloco.fornecedorId || !bloco.valorUnitario,
  );

  const handleConfirm = async () => {
    const payload: OrcamentoBlocoInput[] = [];

    for (const bloco of blocos) {
      const valor = Number(bloco.valorUnitario.replace(",", "."));

      if (!bloco.fornecedorId || Number.isNaN(valor) || valor <= 0) {
        setSubmitError(
          "Informe um fornecedor ativo e um valor unitário maior que zero em cada bloco.",
        );
        return;
      }

      payload.push({
        fornecedorId: bloco.fornecedorId,
        valorUnitario: valor,
      });
    }

    const fornecedorIds = payload.map((bloco) => bloco.fornecedorId);

    if (new Set(fornecedorIds).size !== fornecedorIds.length) {
      setSubmitError(
        "Não é permitido repetir o mesmo fornecedor no mesmo item.",
      );
      return;
    }

    setSubmitError(null);

    try {
      await onSubmit(payload);
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

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lançar orçamento</DialogTitle>

          <DialogDescription>
            Cada bloco é um fornecedor e um valor unitário de{" "}
            {itemDescricao}. Um bloco já envia; use + para lançar vários
            de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {blocos.map((bloco, index) => (
            <FieldGroup
              key={bloco.key}
              className="gap-3 rounded-md border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  Bloco {index + 1}
                </p>

                {blocos.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removerBloco(bloco.key)}
                    disabled={isSubmitting}
                    className="text-destructive hover:text-destructive"
                    aria-label={`Remover bloco ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Field>
                <FieldLabel htmlFor={`orcamento-fornecedor-${bloco.key}`}>
                  Fornecedor
                </FieldLabel>

                <Select
                  value={bloco.fornecedorId}
                  onValueChange={(value) =>
                    atualizarBloco(bloco.key, "fornecedorId", value)
                  }
                  disabled={isLoading || isSubmitting}
                >
                  <SelectTrigger
                    id={`orcamento-fornecedor-${bloco.key}`}
                  >
                    <SelectValue placeholder="Selecione um fornecedor ativo" />
                  </SelectTrigger>

                  <SelectContent>
                    {fornecedoresDoBloco(bloco).map((fornecedor) => (
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
                <FieldLabel htmlFor={`orcamento-valor-${bloco.key}`}>
                  Valor unitário
                </FieldLabel>

                <Input
                  id={`orcamento-valor-${bloco.key}`}
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={bloco.valorUnitario}
                  onChange={(event) =>
                    atualizarBloco(
                      bloco.key,
                      "valorUnitario",
                      event.target.value,
                    )
                  }
                  disabled={isSubmitting}
                />
              </Field>
            </FieldGroup>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adicionarBloco}
            disabled={isSubmitting || !podeAdicionarBloco}
          >
            <Plus className="h-4 w-4" />
            Adicionar bloco
          </Button>
        </div>

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
              blocosIncompletos
            }
          >
            {isSubmitting ? "Salvando..." : "Lançar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
