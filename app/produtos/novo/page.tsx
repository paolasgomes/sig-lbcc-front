"use client";

import { ProdutoForm } from "@/components/produtos/produto-form";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PERFIS_GESTAO_BASE } from "@/lib/access-control";

export default function NovoProdutoPage() {
  return (
    <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
      <ProdutoForm modo="criar" />
    </DashboardLayout>
  );
}
