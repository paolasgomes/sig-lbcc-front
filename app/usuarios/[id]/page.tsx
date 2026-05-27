"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Edit,
  Mail,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useData } from "@/contexts/data-context";
import { PerfilUsuario } from "@/types";
import { PERFIS_GESTAO_BASE } from "@/lib/access-control";

interface PageProps {
  params: Promise<{ id: string }>;
}

const PERFIL_LABEL: Record<PerfilUsuario, string> = {
  [PerfilUsuario.OPERADOR]: "Operador",
  [PerfilUsuario.GESTOR]: "Gestor",
  [PerfilUsuario.PREFEITURA]: "Prefeitura",
};

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  try {
    return format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return value;
  }
}

export default function UsuarioDetalhePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const {
    getUsuarioById,
    usuariosLoading,
    usuariosError,
    refreshUsuarios,
    deleteUsuario,
  } = useData();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const usuario = getUsuarioById(id);

  const handleDelete = async () => {
    if (!usuario) {
      return;
    }

    const confirmar = window.confirm(`Excluir o usuário ${usuario.nome}?`);

    if (!confirmar) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteUsuario(usuario.id);
      router.replace("/usuarios");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Erro ao excluir usuário.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (usuariosLoading) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
        <div className="flex min-h-[60vh] items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="h-5 w-5" />
          <span>Carregando usuário...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (usuariosError) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/usuarios">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Detalhe do Usuário</h1>
              <p className="text-muted-foreground">Não foi possível carregar os dados.</p>
            </div>
          </div>

          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar usuários</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{usuariosError}</span>
              <Button variant="outline" onClick={() => void refreshUsuarios()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  if (!usuario) {
    notFound();
  }

  return (
    <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/usuarios">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{usuario.nome}</h1>
                <Badge
                  variant="outline"
                  className={
                    usuario.ativo
                      ? "border-success/30 text-success"
                      : "text-muted-foreground"
                  }
                >
                  {usuario.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{usuario.email}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/usuarios/${usuario.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </div>

        {deleteError && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível excluir o usuário</AlertTitle>
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados básicos
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{usuario.nome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{usuario.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Perfil</p>
                <div className="mt-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">{PERFIL_LABEL[usuario.perfil]}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-2 flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                  <span
                    className={
                      usuario.ativo
                        ? "text-success font-medium"
                        : "text-muted-foreground font-medium"
                    }
                  >
                    {usuario.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Metadados
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-mono text-sm">{usuario.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDateTime(usuario.created_at)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Atualizado em</p>
                <p className="font-medium">{formatDateTime(usuario.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
