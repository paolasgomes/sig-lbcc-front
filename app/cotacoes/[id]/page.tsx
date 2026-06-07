"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useCotacao } from "@/hooks/use-cotacoes";
import { useUsuario } from "@/hooks/use-usuario";
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";
import { isCotacaoVencida, formatCotacaoNumero, formatDateOnly } from "@/lib/cotacoes-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  Pencil,
  FileText,
  Ban,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CotacaoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CotacaoDetailPage({ params }: CotacaoDetailPageProps) {
  const { id } = use(params);
  const {
    cotacao,
    isLoading,
    error,
    alternarStatus,
    isTogglingStatus,
  } = useCotacao(id);
  const { isGestor } = useUsuario();
  const [actionError, setActionError] = useState<string | null>(null);

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

  const vencida = cotacao.ativo && isCotacaoVencida(cotacao.dataValidade);

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const handleToggleStatus = async () => {
    setActionError(null);
    try {
      await alternarStatus();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Erro ao alterar status da cotação.",
      );
    }
  };

  return (
    <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/cotacoes">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Cotação {formatCotacaoNumero(cotacao)}
                </h1>
                <StatusBadge status={cotacao.ativo ? "ativo" : "inativo"} />
              </div>
              <p className="text-muted-foreground">{cotacao.descricao}</p>
            </div>
          </div>

          {isGestor && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/cotacoes/${cotacao.id}/editar`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isTogglingStatus}>
                    {cotacao.ativo ? (
                      <>
                        <Ban className="mr-2 h-4 w-4" />
                        Inativar
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Ativar
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {cotacao.ativo ? "Inativar cotação?" : "Ativar cotação?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {cotacao.ativo
                        ? "A cotação ficará inativa e não poderá ser utilizada em novas propostas."
                        : "A cotação será reativada."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleToggleStatus}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {actionError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro na operação</AlertTitle>
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informações gerais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Paciente</p>
              <p className="font-medium">
                {cotacao.pacienteNome ?? cotacao.pacienteId}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Área</p>
              <p className="font-medium">{cotacao.areaNome ?? cotacao.areaId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Validade</p>
              <div className="flex items-center gap-1 font-medium">
                {formatDateOnly(cotacao.dataValidade)}
                {vencida && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            {cotacao.observacoes && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Observações</p>
                <p>{cotacao.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Itens
            </CardTitle>
            <CardDescription>
              {cotacao.itens.length} item(ns) incluído(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-center">Unidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotacao.itens.map((item, index) => (
                    <TableRow key={item.id ?? index}>
                      <TableCell className="font-medium">{item.descricao}</TableCell>
                      <TableCell className="text-center">{item.quantidade}</TableCell>
                      <TableCell className="text-center">{item.unidade}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criado em</span>
              <span>{formatDateTime(cotacao.criadoEm)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
