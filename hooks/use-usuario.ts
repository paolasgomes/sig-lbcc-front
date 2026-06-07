"use client";

import { useAuth } from "@/contexts/auth-context";
import { PerfilUsuario } from "@/types";

export function useUsuario() {
  const { usuario } = useAuth();
  const isGestor = usuario?.perfil === PerfilUsuario.GESTOR;

  return { usuario, perfil: usuario?.perfil ?? null, isGestor };
}
