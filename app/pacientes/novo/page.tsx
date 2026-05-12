"use client";

import PageHeader from "@/components/layout/page-header";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PacienteForm } from "@/components/pacientes/paciente-form";

export default function NovoPacientePage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          backHref="/pacientes"
          title="Novo Paciente"
          description="Preencha os dados para cadastrar um novo paciente"
        />

        <PacienteForm modo="criar" />
      </div>
    </DashboardLayout>
  );
}
