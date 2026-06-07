"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CotacaoForm } from "@/components/cotacoes/cotacao-form";
import { useCotacao } from "@/hooks/use-cotacoes";
import { useUsuario } from "@/hooks/use-usuario";
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";
import { Spinner } from "@/components/ui/spinner";

interface EditarCotacaoPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarCotacaoPage({ params }: EditarCotacaoPageProps) {
  const { id } = use(params);
  const { cotacao, isLoading, error } = useCotacao(id);
  const { isGestor } = useUsuario();

  if (isLoading) {
    return (
      <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !cotacao) {
    notFound();
  }

  if (!isGestor) {
    notFound();
  }

  return (
    <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
      <CotacaoForm cotacao={cotacao} isEditing />
    </DashboardLayout>
  );
}
