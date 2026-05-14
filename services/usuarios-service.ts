import { api } from "./api";
import { UsuarioCreateInput, UsuarioDTO, UsuarioUpdateInput } from "@/types";
import { getFriendlyApiError } from "@/lib/api-errors";

function getErrorMessage(error: unknown, fallback: string) {
  return getFriendlyApiError(error, fallback);
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

export async function inativarUsuario(id: string) {
  try {
    await api.patch(`usuarios/${id}/status`);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao inativar usuário."));
  }
}
