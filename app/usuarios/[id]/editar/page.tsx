"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { UsuarioForm } from "@/components/usuarios/usuario-form";
import { useData } from "@/contexts/data-context";
import { obterUsuario } from "@/services/usuarios-service";
import { UsuarioDTO } from "@/types";
import { PERFIS_GESTAO_BASE } from "@/lib/access-control";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditarUsuarioPage({ params }: PageProps) {
  const { id } = use(params);
  const { getUsuarioById, usuariosLoading, usuariosError, refreshUsuarios } = useData();
  const usuarioContexto = getUsuarioById(id);
  const [usuarioFallback, setUsuarioFallback] = useState<UsuarioDTO | null>(null);
  const [usuarioFallbackLoading, setUsuarioFallbackLoading] = useState(false);
  const [usuarioFallbackError, setUsuarioFallbackError] = useState<string | null>(null);

  useEffect(() => {
    if (usuariosLoading || usuariosError || usuarioContexto) {
      return;
    }

    let ativo = true;

    setUsuarioFallbackLoading(true);
    setUsuarioFallbackError(null);

    void obterUsuario(id)
      .then((usuario) => {
        if (!ativo) {
          return;
        }

        setUsuarioFallback(usuario);
      })
      .catch((error) => {
        if (!ativo) {
          return;
        }

        setUsuarioFallbackError(
          error instanceof Error ? error.message : "Não foi possível carregar o usuário.",
        );
      })
      .finally(() => {
        if (!ativo) {
          return;
        }

        setUsuarioFallbackLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [id, usuarioContexto, usuariosError, usuariosLoading]);

  const usuario = usuarioContexto ?? usuarioFallback;

  if (usuariosLoading || usuarioFallbackLoading) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
        <div className="flex min-h-[60vh] items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="h-5 w-5" />
          <span>Carregando usuário...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (usuariosError || usuarioFallbackError) {
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
              <h1 className="text-2xl font-bold text-foreground">Editar Usuario</h1>
              <p className="text-muted-foreground">Não foi possível carregar os dados.</p>
            </div>
          </div>

          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar usuários</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{usuariosError ?? usuarioFallbackError}</span>
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/usuarios">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Editar Usuario</h1>
            <p className="text-muted-foreground">{usuario.nome}</p>
          </div>
        </div>

        <UsuarioForm usuario={usuario} isEditing />
      </div>
    </DashboardLayout>
  );
}
