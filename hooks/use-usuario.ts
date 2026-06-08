"use client";

import { useAuth } from "@/contexts/auth-context";
import { PerfilUsuario } from "@/types";

export function useUsuario() {
  const { usuario } = useAuth();
  const perfil = usuario?.perfil ?? null;
  const isGestor = perfil === PerfilUsuario.GESTOR;
  const podeAlterarStatusPaciente =
    perfil === PerfilUsuario.OPERADOR || perfil === PerfilUsuario.GESTOR;

  return { usuario, perfil, isGestor, podeAlterarStatusPaciente };
}
