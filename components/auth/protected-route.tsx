"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PerfilUsuario } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { usuarioTemAcessoAoModulo } from "@/lib/access-control";

interface ProtectedRouteProps {
  children: React.ReactNode;
  perfisPermitidos?: (PerfilUsuario | string)[];
  allowedRoles?: string[];
}

export function ProtectedRoute({
  children,
  perfisPermitidos,
  allowedRoles,
}: ProtectedRouteProps) {
  const { usuario, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !usuario) {
      router.push("/login");
    }

    if (!isLoading && usuario && !usuarioTemAcessoAoModulo(usuario, { perfisPermitidos, allowedRoles })) {
      router.push("/403");
    }
  }, [usuario, isLoading, router, perfisPermitidos, allowedRoles]);

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

  if (!usuarioTemAcessoAoModulo(usuario, { perfisPermitidos, allowedRoles })) {
    return null;
  }

  return <>{children}</>;
}
