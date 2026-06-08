"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useFornecedor } from "@/hooks/use-fornecedores";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { Spinner } from "@/components/ui/spinner";
import { PERFIS_GESTAO_BASE } from "@/lib/access-control";
import { formatCnpj, formatPhone } from "@/lib/formatters";
import { ArrowLeft, Pencil, Building2, Phone, Mail } from "lucide-react";

interface FornecedorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function FornecedorDetailPage({ params }: FornecedorDetailPageProps) {
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

  const displayName = fornecedor.nomeFantasia ?? fornecedor.razaoSocial;

  return (
    <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/fornecedores">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
                <StatusBadge status={fornecedor.ativo ? "ativo" : "inativo"} />
              </div>
              <p className="text-muted-foreground">{fornecedor.razaoSocial}</p>
            </div>
          </div>
          <Button asChild>
            <Link href={`/fornecedores/${fornecedor.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados do Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Razão Social</p>
              <p>{fornecedor.razaoSocial}</p>
            </div>
            {fornecedor.nomeFantasia && (
              <div>
                <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                <p>{fornecedor.nomeFantasia}</p>
              </div>
            )}
            {fornecedor.cnpj && (
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="font-mono">{formatCnpj(fornecedor.cnpj)}</p>
              </div>
            )}
            {fornecedor.telefone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{formatPhone(fornecedor.telefone)}</span>
              </div>
            )}
            {fornecedor.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{fornecedor.email}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
