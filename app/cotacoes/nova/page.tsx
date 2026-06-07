"use client";

import { use } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CotacaoForm } from "@/components/cotacoes/cotacao-form";
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";

export default function NovaCotacaoPage() {
  return (
    <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
      <CotacaoForm />
    </DashboardLayout>
  );
}
