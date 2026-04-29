import axios from "axios";
import { api } from "./api";
import type {
  ApiAreaDTO,
  AreaAtendimento,
  AreaCreateInput,
  AreaUpdateInput,
} from "@/types";

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

export function mapApiAreaToArea(apiArea: ApiAreaDTO, fallbackId = ""): AreaAtendimento {
  return {
    id: apiArea.id ?? fallbackId,
    nome: apiArea.nome ?? "",
    descricao: apiArea.descricao ?? "",
    ativa: apiArea.ativa ?? true,
  };
}

export async function listarAreas() {
  try {
    const response = await api.get<ApiAreaDTO[]>("/areas");

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar áreas."));
  }
}

export async function obterArea(id: string) {
  try {
    const response = await api.get<ApiAreaDTO>(`/areas/${id}`);

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar área."));
  }
}

export async function criarArea(dados: AreaCreateInput) {
  try {
    const response = await api.post<ApiAreaDTO>("/areas", dados);

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao criar área."));
  }
}

export async function atualizarArea(id: string, dados: AreaUpdateInput) {
  try {
    const response = await api.put<ApiAreaDTO>(`/areas/${id}`, dados);

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao atualizar área."));
  }
}

export async function inativarArea(id: string) {
  try {
    await api.delete(`/areas/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao inativar área."));
  }
}
