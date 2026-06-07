"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AtendimentoForm } from "@/components/atendimentos/atendimento-form";
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";

export default function NovoAtendimentoPage() {
  return (
    <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
      <AtendimentoForm />
    </DashboardLayout>
  );
}
