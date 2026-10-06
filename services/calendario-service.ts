import { api } from "@/services/api";
import { getFriendlyApiError } from "@/lib/api-errors";

export interface Feriado {
  id: string;
  data: string;
  nome: string;
  ativo: boolean;
  criado_por: string | null;
  atualizado_por: string | null;
  created_at: string;
  updated_at: string;
}

export async function listarFeriados() {
  try {
    const response = await api.get<Feriado[]>("/calendario/feriados");
    return response.data;
  } catch (error) {
    throw new Error(getFriendlyApiError(error, "Erro ao carregar os feriados."));
  }
}

export async function criarFeriado(dados: { data: string; nome: string }) {
  try {
    const response = await api.post<Feriado>("/calendario/feriados", dados);
    return response.data;
  } catch (error) {
    throw new Error(getFriendlyApiError(error, "Erro ao cadastrar o feriado."));
  }
}

export async function atualizarFeriado(
  id: string,
  dados: Partial<Pick<Feriado, "data" | "nome">>,
) {
  try {
    const response = await api.put<Feriado>(`/calendario/feriados/${id}`, dados);
    return response.data;
  } catch (error) {
    throw new Error(getFriendlyApiError(error, "Erro ao atualizar o feriado."));
  }
}

export async function alternarStatusFeriado(id: string, ativo: boolean) {
  try {
    const response = await api.patch<Feriado>(
      `/calendario/feriados/${id}/status`,
      { ativo },
    );
    return response.data;
  } catch (error) {
    throw new Error(getFriendlyApiError(error, "Erro ao alterar o feriado."));
  }
}
