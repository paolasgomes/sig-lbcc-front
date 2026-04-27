"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PerfilUsuario } from "@/types";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  perfisPermitidos?: (PerfilUsuario | string)[];
  allowedRoles?: string[];
}

function mapLegacyRoleToPerfil(role: string): PerfilUsuario {
  const normalizedRole = role.toLowerCase();

  if (normalizedRole === "gestor") {
    return PerfilUsuario.GESTOR;
  }

  if (normalizedRole === "prefeitura") {
    return PerfilUsuario.PREFEITURA;
  }

  return PerfilUsuario.OPERADOR;
}

export function ProtectedRoute({
  children,
  perfisPermitidos,
  allowedRoles,
}: ProtectedRouteProps) {
  const { usuario, isLoading } = useAuth();
  const router = useRouter();
  const perfisEfetivos =
    perfisPermitidos?.map((perfil) => mapLegacyRoleToPerfil(String(perfil))) ??
    allowedRoles?.map((role) => mapLegacyRoleToPerfil(role));

  useEffect(() => {
    if (!isLoading && !usuario) {
      router.push("/login");
    }

    if (
      !isLoading &&
      usuario &&
      perfisEfetivos &&
      !perfisEfetivos.includes(usuario.perfil)
    ) {
      router.push("/403");
    }
  }, [usuario, isLoading, router, perfisEfetivos]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  if (perfisEfetivos && !perfisEfetivos.includes(usuario.perfil)) {
    return null;
  }

  return <>{children}</>;
}
