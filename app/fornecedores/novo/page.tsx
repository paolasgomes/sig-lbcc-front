"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FornecedorForm } from "@/components/fornecedores/fornecedor-form";
import { PERFIS_GESTAO_BASE } from "@/lib/access-control";

export default function NovoFornecedorPage() {
  return (
    <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
      <FornecedorForm />
    </DashboardLayout>
  );
}
