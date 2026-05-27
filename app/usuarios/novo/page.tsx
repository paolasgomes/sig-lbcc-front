"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { UsuarioForm } from "@/components/usuarios/usuario-form";
import PageHeader from "@/components/layout/page-header";
import { PERFIS_GESTAO_BASE } from "@/lib/access-control";

export default function NovoUsuarioPage() {
  return (
    <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
      <div className="flex flex-col gap-6">
        <PageHeader
          backHref="/usuarios"
          title="Novo Usuário"
          description="Preencha os dados para cadastrar um novo usuário"
        />

        <UsuarioForm />
      </div>
    </DashboardLayout>
  );
}
