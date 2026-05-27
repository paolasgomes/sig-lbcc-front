"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PacienteForm } from "@/components/pacientes/paciente-form";
import { useData } from "@/contexts/data-context";
import { Paciente } from "@/types";
import { PERFIS_DASHBOARD_PACIENTES } from "@/lib/access-control";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditarPacientePage({ params }: PageProps) {
  const { id } = use(params);
  const { getPacienteById, fetchPacienteById } = useData();
  const [paciente, setPaciente] = useState<Paciente | undefined>(() =>
    getPacienteById(id),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const pacienteLocal = getPacienteById(id);

    if (pacienteLocal) {
      setPaciente(pacienteLocal);
    }

    setIsLoading(true);
    setLoadError(null);

    void fetchPacienteById(id)
      .then((pacienteDetalhado) => {
        setPaciente(pacienteDetalhado);
      })
      .catch((error) => {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar paciente para edição.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading && !paciente) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_DASHBOARD_PACIENTES}>
        <div className="flex min-h-80 items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="h-5 w-5" />
          <span>Carregando paciente...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (loadError && !paciente) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_DASHBOARD_PACIENTES}>
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar o paciente</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (!paciente) {
    notFound();
  }

  return (
    <DashboardLayout perfisPermitidos={PERFIS_DASHBOARD_PACIENTES}>
      <div className="flex flex-col gap-6">
        {loadError && (
          <Alert variant="destructive">
            <AlertTitle>Falha ao atualizar os dados carregados</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/pacientes/${paciente.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Editar Paciente</h1>
            <p className="text-muted-foreground">{paciente.nomeCompleto}</p>
          </div>
        </div>

        <PacienteForm paciente={paciente} modo="editar" />
      </div>
    </DashboardLayout>
  );
}
