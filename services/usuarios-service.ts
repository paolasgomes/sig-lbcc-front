import axios from "axios";
import { api } from "./api";
import { UsuarioCreateInput, UsuarioDTO, UsuarioUpdateInput } from "@/types";

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error || error.response?.data?.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function listarUsuarios() {
  try {
    const response = await api.get<UsuarioDTO[]>("/usuarios");

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar usuários."));
  }
}

export async function obterUsuario(id: string) {
  try {
    const response = await api.get<UsuarioDTO>(`/usuarios/${id}`);

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar usuário."));
  }
}

export async function criarUsuario(dados: UsuarioCreateInput) {
  try {
    const response = await api.post<UsuarioDTO>("/usuarios", dados);

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao criar usuário."));
  }
}

export async function atualizarUsuario(id: string, dados: UsuarioUpdateInput) {
  try {
    const response = await api.put<UsuarioDTO>(`/usuarios/${id}`, dados);

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao atualizar usuário."));
  }
}

export async function excluirUsuario(id: string) {
  try {
    await api.delete(`/usuarios/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao excluir usuário."));
  }
}