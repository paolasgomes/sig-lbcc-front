import axios from "axios";
import { api, TOKEN_STORAGE_KEY } from "./api";
import { UsuarioDTO } from "@/types";

interface LoginResponse {
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

  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function saveToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, token);

  document.cookie = `${TOKEN_STORAGE_KEY}=${token}; path=/; max-age=86400; SameSite=Strict`;
}

export function removeToken() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY);

  document.cookie = `${TOKEN_STORAGE_KEY}=; path=/; max-age=0; SameSite=Strict`;
}

export async function login(email: string, senha: string) {
  try {
    const response = await api.post<LoginResponse>("/auth/login", {
      email,
      password: senha,
    });

    if (!response.data?.access_token) {
      throw new Error("Resposta de login inválida.");
    }

    saveToken(response.data.access_token);

    return response.data.access_token;
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
