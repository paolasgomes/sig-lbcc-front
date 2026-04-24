import axios from "axios";
import { api, TOKEN_STORAGE_KEY } from "./api";

interface LoginResponse {
  token: string;
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
}

export function removeToken() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function login(email: string, senha: string) {
  try {
    const response = await api.post<LoginResponse>("/login", { email, senha });

    if (!response.data?.token) {
      throw new Error("Resposta de login inválida.");
    }

    saveToken(response.data.token);

    return response.data.token;
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
