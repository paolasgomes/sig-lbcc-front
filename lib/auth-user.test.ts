import { describe, it, expect } from "vitest";
import {
  buildUsuarioFromLoginResponse,
  buildUsuarioFromStoredProfile,
  buildUsuarioFromToken,
  isSupabaseJwtRole,
} from "./auth-user";
import { PerfilUsuario } from "@/types";

const SUPABASE_GESTOR_JWT_PAYLOAD = {
  sub: "1035fdff-2ee9-4153-b0d0-fd3c326c290a",
  email: "gestor@email.com",
  role: "authenticated",
};

describe("isSupabaseJwtRole", () => {
  it("returns true for Supabase authenticated role", () => {
    expect(isSupabaseJwtRole("authenticated")).toBe(true);
    expect(isSupabaseJwtRole("Authenticated")).toBe(true);
  });

  it("returns false for application roles", () => {
    expect(isSupabaseJwtRole("gestor")).toBe(false);
    expect(isSupabaseJwtRole("operador")).toBe(false);
  });
});

describe("buildUsuarioFromToken", () => {
  it("does not treat Supabase authenticated role as app perfil", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    );
    const payload = Buffer.from(JSON.stringify(SUPABASE_GESTOR_JWT_PAYLOAD)).toString(
      "base64url",
    );
    const token = `${header}.${payload}.signature`;

    const usuario = buildUsuarioFromToken(token);

    expect(usuario).toEqual({
      id: "1035fdff-2ee9-4153-b0d0-fd3c326c290a",
      nome: "gestor",
      email: "gestor@email.com",
      senha: "",
      perfil: PerfilUsuario.OPERADOR,
      role: undefined,
      ativo: true,
    });
  });

  it("maps explicit perfil claim from token", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    );
    const payload = Buffer.from(
      JSON.stringify({
        sub: "user-1",
        email: "gestor@email.com",
        perfil: "gestor",
      }),
    ).toString("base64url");
    const token = `${header}.${payload}.signature`;

    const usuario = buildUsuarioFromToken(token);

    expect(usuario?.perfil).toBe(PerfilUsuario.GESTOR);
    expect(usuario?.role).toBe(PerfilUsuario.GESTOR);
  });
});

describe("buildUsuarioFromStoredProfile", () => {
  it("restores gestor perfil from persisted login user", () => {
    const usuario = buildUsuarioFromStoredProfile({
      id: "user-1",
      nome: "Italo Braga",
      email: "gestor@email.com",
      perfil: PerfilUsuario.GESTOR,
      ativo: true,
      created_at: "2026-06-07T00:00:00Z",
      updated_at: "2026-06-07T00:00:00Z",
    });

    expect(usuario).toEqual({
      id: "user-1",
      nome: "Italo Braga",
      email: "gestor@email.com",
      senha: "",
      perfil: PerfilUsuario.GESTOR,
      role: PerfilUsuario.GESTOR,
      ativo: true,
    });
  });
});

describe("buildUsuarioFromLoginResponse", () => {
  it("maps login response user with gestor perfil", () => {
    const usuario = buildUsuarioFromLoginResponse({
      access_token: "token",
      user: {
        id: "user-1",
        nome: "Italo Braga",
        email: "gestor@email.com",
        perfil: PerfilUsuario.GESTOR,
        ativo: true,
        created_at: "2026-06-07T00:00:00Z",
        updated_at: "2026-06-07T00:00:00Z",
      },
    });

    expect(usuario.perfil).toBe(PerfilUsuario.GESTOR);
    expect(usuario.role).toBe(PerfilUsuario.GESTOR);
  });
});
