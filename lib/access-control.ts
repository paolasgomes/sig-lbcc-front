import { PerfilUsuario, Usuario } from "@/types";

export const PERFIS_DASHBOARD_PACIENTES: PerfilUsuario[] = [
  PerfilUsuario.OPERADOR,
  PerfilUsuario.GESTOR,
  PerfilUsuario.PREFEITURA,
];

export const PERFIS_GESTAO_BASE: PerfilUsuario[] = [
  PerfilUsuario.OPERADOR,
  PerfilUsuario.GESTOR,
];

export const ROLES_ATENDIMENTOS_E_COTACOES = ["admin", "gestor", "atendente"];

export const ROLES_GESTAO_COMPLETA = ["admin", "gestor"];

function normalizeAccessValue(value: string) {
  return value.trim().toLowerCase();
}

export function mapLegacyRoleToPerfil(role: string): PerfilUsuario {
  const normalizedRole = normalizeAccessValue(role);

  if (normalizedRole === "admin" || normalizedRole === "gestor") {
    return PerfilUsuario.GESTOR;
  }

  if (normalizedRole === "prefeitura") {
    return PerfilUsuario.PREFEITURA;
  }

  return PerfilUsuario.OPERADOR;
}

function perfilToLegacyRole(perfil: PerfilUsuario) {
  if (perfil === PerfilUsuario.GESTOR) {
    return "gestor";
  }

  if (perfil === PerfilUsuario.PREFEITURA) {
    return "prefeitura";
  }

  return "operador";
}

interface AccessRules {
  perfisPermitidos?: PerfilUsuario[];
  allowedRoles?: string[];
}

export function usuarioTemAcessoAoModulo(
  usuario: Pick<Usuario, "perfil" | "role"> | null,
  regras: AccessRules,
) {
  if (!usuario) {
    return false;
  }

  const atendePerfis =
    !regras.perfisPermitidos || regras.perfisPermitidos.includes(usuario.perfil);

  const atendeRoles =
    !regras.allowedRoles ||
    regras.allowedRoles.map(normalizeAccessValue).includes(
      normalizeAccessValue(usuario.role ?? perfilToLegacyRole(usuario.perfil)),
    );

  return atendePerfis && atendeRoles;
}