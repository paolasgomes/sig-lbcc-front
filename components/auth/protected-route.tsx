"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PerfilUsuario } from "@/types";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  perfisPermitidos?: PerfilUsuario[];
}

export function ProtectedRoute({ children, perfisPermitidos }: ProtectedRouteProps) {
  const { usuario, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !usuario) {
      router.push("/login");
    }

    if (
      !isLoading &&
      usuario &&
      perfisPermitidos &&
      !perfisPermitidos.includes(usuario.perfil)
    ) {
      router.push("/403");
    }
  }, [usuario, isLoading, router, perfisPermitidos]);

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

  if (perfisPermitidos && !perfisPermitidos.includes(usuario.perfil)) {
    return null;
  }

  return <>{children}</>;
}
