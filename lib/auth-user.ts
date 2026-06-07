import { mapLegacyRoleToPerfil } from "@/lib/access-control";
import type { LoginResponse } from "@/services/auth-service";
import { PerfilUsuario, Usuario, UsuarioDTO } from "@/types";

const SUPABASE_JWT_ROLE = "authenticated";

export function isSupabaseJwtRole(role: unknown): boolean {
  return typeof role === "string" && role.toLowerCase() === SUPABASE_JWT_ROLE;
}

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

function mapPerfil(value: unknown): PerfilUsuario {
  if (typeof value !== "string" || isSupabaseJwtRole(value)) {
    return PerfilUsuario.OPERADOR;
  }

  return mapLegacyRoleToPerfil(value);
}

function resolveAppRole(payload: Record<string, unknown>): string | undefined {
  if (typeof payload.perfil === "string") {
    return payload.perfil;
  }

  if (typeof payload.role === "string" && !isSupabaseJwtRole(payload.role)) {
    return payload.role;
  }

  return undefined;
}

export function buildUsuarioFromToken(token: string): Usuario | null {
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

  const role = resolveAppRole(payload);
  const perfil = mapPerfil(payload.perfil ?? role);

  return {
    id,
    nome,
    email,
    senha: "",
    perfil,
    role,
    ativo: true,
  };
}

export function buildUsuarioFromStoredProfile(profile: UsuarioDTO | Usuario): Usuario {
  const perfil =
    typeof profile.perfil === "string"
      ? mapLegacyRoleToPerfil(profile.perfil)
      : profile.perfil;

  return {
    id: profile.id,
    nome: profile.nome,
    email: profile.email,
    senha: "",
    perfil,
    role: profile.role ?? perfil,
    ativo: profile.ativo,
  };
}

export function buildUsuarioFromLoginResponse(loginResponse: LoginResponse): Usuario {
  return buildUsuarioFromStoredProfile(loginResponse.user);
}
