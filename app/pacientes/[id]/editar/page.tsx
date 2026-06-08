"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PacienteForm } from "@/components/pacientes/paciente-form";
import { usePaciente } from "@/hooks/use-pacientes";
import { PERFIS_DASHBOARD_PACIENTES } from "@/lib/access-control";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditarPacientePage({ params }: PageProps) {
  const { id } = use(params);
  const { paciente, isLoading, error } = usePaciente(id);

  if (isLoading) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_DASHBOARD_PACIENTES}>
        <div className="flex min-h-80 items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="h-5 w-5" />
          <span>Carregando paciente...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !paciente) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_DASHBOARD_PACIENTES}>
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar o paciente</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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
