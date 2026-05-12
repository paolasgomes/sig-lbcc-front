"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { UsuarioForm } from "@/components/usuarios/usuario-form";
import PageHeader from "@/components/layout/page-header";

export default function NovoUsuarioPage() {
  return (
    <DashboardLayout>
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
