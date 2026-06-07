"use client";

import { useMemo } from "react";
import { getStoredToken } from "@/services/auth-service";
import { mapLegacyRoleToPerfil } from "@/lib/access-control";
import { PerfilUsuario, Usuario } from "@/types";

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalizedPayload));
  } catch {
    return null;
  }
}

function buildUsuarioFromToken(token: string): Usuario | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const email =
    typeof payload.email === "string"
      ? payload.email
      : typeof payload.username === "string"
        ? payload.username
        : "";

  const nome =
    typeof payload.nome === "string"
      ? payload.nome
      : typeof payload.name === "string"
        ? payload.name
        : email
          ? email.split("@")[0]
          : "Usuário";

  const id =
    typeof payload.sub === "string"
      ? payload.sub
      : typeof payload.id === "string"
        ? payload.id
        : typeof payload.userId === "string"
          ? payload.userId
          : nome;

  const perfil =
    typeof payload.perfil === "string" || typeof payload.role === "string"
      ? mapLegacyRoleToPerfil(String(payload.perfil ?? payload.role))
      : PerfilUsuario.OPERADOR;

  const role =
    typeof payload.role === "string"
      ? payload.role
      : typeof payload.perfil === "string"
        ? payload.perfil
        : undefined;

  return { id, nome, email, perfil, role, ativo: true };
}

export function useUsuario() {
  const usuario = useMemo(() => {
    const token = getStoredToken();
    if (!token) return null;
    return buildUsuarioFromToken(token);
  }, []);

  const isGestor = usuario?.perfil === PerfilUsuario.GESTOR;

  return { usuario, perfil: usuario?.perfil ?? null, isGestor };
}
