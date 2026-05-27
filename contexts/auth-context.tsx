"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Usuario, PerfilUsuario } from "@/types";
import {
  getStoredToken,
  login as loginService,
  removeToken,
  type LoginResponse,
} from "@/services/auth-service";
import { mapLegacyRoleToPerfil } from "@/lib/access-control";

interface AuthContextType {
  usuario: Usuario | null;
  user: Usuario | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  podeVisualizarValores: () => boolean;
  podeAlterarStatus: () => boolean;
  podeCriarCotacao: () => boolean;
  podeEditarCadastrosBase: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = atob(normalizedPayload);

    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
}

function mapPerfil(value: unknown): PerfilUsuario {
  if (typeof value !== "string") {
    return PerfilUsuario.OPERADOR;
  }

  return mapLegacyRoleToPerfil(value);
}

function buildUsuarioFromToken(token: string): Usuario | null {
  const payload = parseJwtPayload(token);

  if (!payload) {
    return null;
  }

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

  const perfil = mapPerfil(payload.perfil ?? payload.role);
  const role =
    typeof payload.role === "string"
      ? payload.role
      : typeof payload.perfil === "string"
        ? payload.perfil
        : undefined;

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

function buildUsuarioFromLoginResponse(loginResponse: LoginResponse): Usuario {
  const { user } = loginResponse;

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    senha: "",
    perfil: user.perfil,
    role: user.role ?? user.perfil,
    ativo: user.ativo,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();

    if (token) {
      const usuarioRecuperado = buildUsuarioFromToken(token);

      if (usuarioRecuperado) {
        setUsuario(usuarioRecuperado);
      } else {
        removeToken();
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUsuario(null);
      removeToken();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (email: string, senha: string): Promise<void> => {
    const loginResponse = await loginService(email, senha);
    const usuarioLogado = buildUsuarioFromLoginResponse(loginResponse);

    setUsuario(
      usuarioLogado ?? {
        id: email,
        nome: email.split("@")[0],
        email,
        senha: "",
        perfil: PerfilUsuario.OPERADOR,
        role: "operador",
        ativo: true,
      },
    );
  };

  const logout = () => {
    setUsuario(null);
    removeToken();
  };

  // Funções de permissão baseadas no perfil
  const podeVisualizarValores = () => {
    return (
      usuario?.perfil === PerfilUsuario.OPERADOR ||
      usuario?.perfil === PerfilUsuario.GESTOR
    );
  };

  const podeAlterarStatus = () => {
    return (
      usuario?.perfil === PerfilUsuario.OPERADOR ||
      usuario?.perfil === PerfilUsuario.GESTOR
    );
  };

  const podeCriarCotacao = () => {
    return (
      usuario?.perfil === PerfilUsuario.OPERADOR ||
      usuario?.perfil === PerfilUsuario.GESTOR
    );
  };

  const podeEditarCadastrosBase = () => {
    return (
      usuario?.perfil === PerfilUsuario.OPERADOR ||
      usuario?.perfil === PerfilUsuario.GESTOR
    );
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        user: usuario,
        isLoading,
        login,
        logout,
        podeVisualizarValores,
        podeAlterarStatus,
        podeCriarCotacao,
        podeEditarCadastrosBase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
