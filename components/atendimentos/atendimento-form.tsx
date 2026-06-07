"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePacientes } from "@/hooks/use-pacientes";
import { useAtendimentos } from "@/hooks/use-atendimentos";
import {
  todayDateOnly,
  getTipoAtendimentoLabel,
} from "@/lib/atendimentos-utils";
import {
  TIPOS_ATENDIMENTO,
  StatusPaciente,
  type Atendimento,
  type TipoAtendimento,
} from "@/types";

interface AtendimentoFormProps {
  atendimento?: Atendimento;
  isEditing?: boolean;
}

export function AtendimentoForm({ atendimento, isEditing }: AtendimentoFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillPacienteId = searchParams.get("pacienteId") ?? "";

  const { pacientes } = usePacientes();
  const { criarAtendimento, atualizarAtendimento, isCreating, isUpdating } =
    useAtendimentos();

  const [formData, setFormData] = useState({
    pacienteId: atendimento?.pacienteId || prefillPacienteId || "",
    tipo: (atendimento?.tipo || "consulta") as TipoAtendimento,
    dataAtendimento: atendimento?.dataAtendimento || todayDateOnly(),
    descricao: atendimento?.descricao || "",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pacientesAtivos = pacientes.filter((p) => p.status === StatusPaciente.ATIVO);
  const pacienteLocked = Boolean(prefillPacienteId && !isEditing);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (
      !formData.pacienteId ||
      !formData.tipo ||
      !formData.dataAtendimento ||
      !formData.descricao.trim()
    ) {
      setSubmitError("Preencha todos os campos obrigatórios.");
      return;
    }

    setSubmitError(null);

    try {
      if (isEditing && atendimento) {
        await atualizarAtendimento({ id: atendimento.id, dados: formData });
        router.push(`/atendimentos/${atendimento.id}`);
      } else {
        const criado = await criarAtendimento(formData);
        if (prefillPacienteId) {
          router.push(`/pacientes/${formData.pacienteId}`);
        } else {
          router.push(`/atendimentos/${criado.id}`);
        }
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Erro ao salvar atendimento.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" asChild>
          <Link href="/atendimentos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Atendimento" : "Novo Atendimento"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Atualize as informações do atendimento"
              : "Registre um novo atendimento no sistema"}
          </p>
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao salvar</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informações do Atendimento</CardTitle>
          <CardDescription>Dados básicos do atendimento</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Paciente *</FieldLabel>
              <select
                value={formData.pacienteId}
                onChange={(e) => handleChange("pacienteId", e.target.value)}
                disabled={pacienteLocked}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Selecione um paciente...</option>
                {pacientesAtivos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nomeCompleto || p.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel>Tipo de Atendimento *</FieldLabel>
              <select
                value={formData.tipo}
                onChange={(e) => handleChange("tipo", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                {TIPOS_ATENDIMENTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {getTipoAtendimentoLabel(tipo)}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel>Data *</FieldLabel>
              <Input
                type="date"
                value={formData.dataAtendimento}
                onChange={(e) => handleChange("dataAtendimento", e.target.value)}
                required
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Descrição *</FieldLabel>
              <Textarea
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder="Descreva o atendimento realizado..."
                rows={3}
                required
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/atendimentos">Cancelar</Link>
        </Button>
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isCreating || isUpdating}
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar
        </Button>
      </div>
    </div>
  );
}
