"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AtendimentoForm } from "@/components/atendimentos/atendimento-form";
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";
import { useAtendimento } from "@/hooks/use-atendimentos";
import { TableLoading } from "@/components/ui/table-state";

interface EditarAtendimentoPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarAtendimentoPage({ params }: EditarAtendimentoPageProps) {
  const { id } = use(params);
  const { atendimento, isLoading } = useAtendimento(id);

  if (isLoading) {
    return (
      <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
        <TableLoading columns={1} rows={4} />
      </DashboardLayout>
    );
  }

  if (!atendimento) {
    notFound();
  }

  return (
    <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
      <AtendimentoForm atendimento={atendimento} isEditing />
    </DashboardLayout>
  );
}
