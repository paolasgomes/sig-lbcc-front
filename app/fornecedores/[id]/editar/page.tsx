"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FornecedorForm } from "@/components/fornecedores/fornecedor-form";
import { useFornecedor } from "@/hooks/use-fornecedores";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { PERFIS_GESTAO_BASE } from "@/lib/access-control";

interface EditarFornecedorPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarFornecedorPage({ params }: EditarFornecedorPageProps) {
  const { id } = use(params);
  const { fornecedor, isLoading, error } = useFornecedor(id);

  if (isLoading) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
        <div className="flex min-h-80 items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="h-5 w-5" />
          <span>Carregando fornecedor...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !fornecedor) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar o fornecedor</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (!fornecedor) {
    notFound();
  }

  return (
    <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
      <FornecedorForm fornecedor={fornecedor} isEditing />
    </DashboardLayout>
  );
}
