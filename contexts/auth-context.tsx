"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Usuario, PerfilUsuario } from "@/types";
import {
  getStoredToken,
  getStoredUser,
  login as loginService,
  removeToken,
  removeStoredUser,
  saveStoredUser,
} from "@/services/auth-service";
import {
  buildUsuarioFromLoginResponse,
  buildUsuarioFromStoredProfile,
  buildUsuarioFromToken,
} from "@/lib/auth-user";

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

function restoreUsuarioFromSession(): Usuario | null {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  const storedUser = getStoredUser();
  if (storedUser) {
    return buildUsuarioFromStoredProfile(storedUser);
  }

  return buildUsuarioFromToken(token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const usuarioRecuperado = restoreUsuarioFromSession();

    if (usuarioRecuperado) {
      setUsuario(usuarioRecuperado);
    } else if (getStoredToken()) {
      removeToken();
      removeStoredUser();
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUsuario(null);
      removeToken();
      removeStoredUser();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (email: string, senha: string): Promise<void> => {
    const loginResponse = await loginService(email, senha);
    const usuarioLogado = buildUsuarioFromLoginResponse(loginResponse);

    saveStoredUser(loginResponse.user);
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
    removeStoredUser();
  };

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
    return usuario?.perfil === PerfilUsuario.GESTOR;
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
