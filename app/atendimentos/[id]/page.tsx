"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Calendar,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAtendimento } from "@/hooks/use-atendimentos";
import { useUsuario } from "@/hooks/use-usuario";
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";
import {
  formatDataAtendimento,
  getTipoAtendimentoLabel,
} from "@/lib/atendimentos-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableLoading } from "@/components/ui/table-state";

interface AtendimentoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AtendimentoDetailPage({ params }: AtendimentoDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { atendimento, isLoading, error, excluirAtendimento, isDeleting } =
    useAtendimento(id);
  const { isGestor } = useUsuario();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
        <TableLoading columns={1} rows={4} />
      </DashboardLayout>
    );
  }

  if (error || !atendimento) {
    notFound();
  }

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    try {
      await excluirAtendimento(atendimento.pacienteId);
      router.push("/atendimentos");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Erro ao excluir atendimento.",
      );
      setShowDeleteDialog(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/atendimentos">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Atendimento</h1>
              <p className="text-muted-foreground">
                {getTipoAtendimentoLabel(atendimento.tipo)} —{" "}
                {formatDataAtendimento(atendimento.dataAtendimento)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/atendimentos/${atendimento.id}/editar`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
            {isGestor && (
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            )}
          </div>
        </div>

        {actionError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro na operação</AlertTitle>
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/pacientes/${atendimento.pacienteId}`}
                className="font-medium hover:underline"
              >
                {atendimento.pacienteNome ?? atendimento.pacienteId}
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalhes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span>{getTipoAtendimentoLabel(atendimento.tipo)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data:</span>
                <span>{formatDataAtendimento(atendimento.dataAtendimento)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Descrição
              </CardTitle>
            </CardHeader>
            <CardContent>
              {atendimento.descricao ? (
                <p className="whitespace-pre-wrap">{atendimento.descricao}</p>
              ) : (
                <p className="text-muted-foreground">Nenhuma descrição registrada.</p>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Metadados</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{formatDateTime(atendimento.criadoEm)}</span>
              </div>
              {atendimento.atualizadoEm && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atualizado em</span>
                  <span>{formatDateTime(atendimento.atualizadoEm)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir atendimento?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O registro será removido
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleDelete()}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
