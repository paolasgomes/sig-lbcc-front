import axios from "axios";
import { api, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "./api";
import { UsuarioDTO } from "@/types";

export interface LoginResponse {
  access_token: string;
  user: UsuarioDTO;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${TOKEN_STORAGE_KEY}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(TOKEN_STORAGE_KEY.length + 1));
}

export function saveToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  document.cookie = `${TOKEN_STORAGE_KEY}=${token}; path=/; max-age=86400; SameSite=Strict`;
}

export function removeToken() {
  if (typeof window === "undefined") {
    return;
  }

  document.cookie = `${TOKEN_STORAGE_KEY}=; path=/; max-age=0; SameSite=Strict`;
}

export function saveStoredUser(user: UsuarioDTO) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function getStoredUser(): UsuarioDTO | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UsuarioDTO;
  } catch {
    return null;
  }
}

export function removeStoredUser() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(USER_STORAGE_KEY);
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>("/auth/login", {
      email,
      password: senha,
    });

    if (!response.data?.access_token) {
      throw new Error("Resposta de login inválida.");
    }

    saveToken(response.data.access_token);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const mensagemErro = error.response?.data?.error || error.response?.data?.message;

      if (mensagemErro) {
        throw new Error(mensagemErro);
      }
    }

    throw new Error("Erro ao fazer login. Tente novamente.");
  }
}
