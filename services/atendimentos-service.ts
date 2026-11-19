
import axios from "axios";
import { api } from "./api";
import { getFriendlyApiError } from "@/lib/api-errors";
import type {
  Atendimento,
  AtendimentoCreateInput,
  AtendimentoUpdateInput,
  FiltroAtendimento,
  TipoAtendimento,
} from "@/types";

export interface ApiAtendimentoDTO {
  id: string;
  paciente_id: string;
  tipo: string;
  data_atendimento: string;
  descricao: string;
  area_id?: string | null;
  observacoes?: string | null;
  transporte?: string | null;
  created_at: string;
  updated_at?: string | null;
  created_by?: string | null;
  pacientes?: { id: string; nome: string } | null;
  areas?: { id: string; nome: string } | null;
}

interface ApiErrorBody {
  erro?: string;
  error?: string;
  message?: string;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    const candidate = data?.erro ?? data?.error ?? data?.message;

    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }

    if (error.response?.status === 403) {
      return "Apenas gestor pode realizar esta ação.";
    }
  }

  return getFriendlyApiError(error, fallback);
}

export function mapApiAtendimentoToAtendimento(
  dto: ApiAtendimentoDTO,
): Atendimento {
  return {
    id: dto.id,
    pacienteId: dto.paciente_id,
    ...(dto.area_id != null && { areaId: dto.area_id }),
    ...(dto.areas?.nome && { areaNome: dto.areas.nome }),
    tipo: dto.tipo as TipoAtendimento,
    dataAtendimento: dto.data_atendimento,
    descricao: dto.descricao ?? "",
    ...(dto.observacoes !== undefined && { observacoes: dto.observacoes }),
    transporte: dto.transporte ?? "",
    criadoEm: dto.created_at,
    atualizadoEm: dto.updated_at ?? undefined,
    pacienteNome: dto.pacientes?.nome,
  };
}

function mapAtendimentoToApiPayload(
  dados: AtendimentoCreateInput | AtendimentoUpdateInput,
) {
  return {
    paciente_id: dados.pacienteId,
    area_id: dados.areaId || null,
    tipo: dados.tipo,
    data_atendimento: dados.dataAtendimento,
    descricao: dados.descricao,
    transporte: dados.transporte ?? null,
  };
}

export async function listarAtendimentos(
  filtros?: Pick<FiltroAtendimento, "areaId" | "periodoInicio" | "periodoFim">,
): Promise<Atendimento[]> {
  try {
    const params: Record<string, string> = {};
    if (filtros?.areaId) params.area_id = filtros.areaId;
    if (filtros?.periodoInicio) params.data_inicio = filtros.periodoInicio;
    if (filtros?.periodoFim) params.data_fim = filtros.periodoFim;

    const response = await api.get<ApiAtendimentoDTO[]>("/atendimentos", {
      params,
    });
    return response.data.map(mapApiAtendimentoToAtendimento);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar atendimentos."));
  }
}

export async function obterAtendimento(id: string): Promise<Atendimento> {
  try {
    const response = await api.get<ApiAtendimentoDTO>(`/atendimentos/${id}`);
    return mapApiAtendimentoToAtendimento(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar atendimento."));
  }
}

export async function criarAtendimento(
  dados: AtendimentoCreateInput,
): Promise<Atendimento> {
  try {
    const response = await api.post<ApiAtendimentoDTO>(
      "/atendimentos",
      mapAtendimentoToApiPayload(dados),
    );
    return mapApiAtendimentoToAtendimento(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao criar atendimento."));
  }
}

export async function atualizarAtendimento(
  id: string,
  dados: AtendimentoUpdateInput,
): Promise<Atendimento> {
  try {
    const response = await api.put<ApiAtendimentoDTO>(
      `/atendimentos/${id}`,
      mapAtendimentoToApiPayload(dados),
    );
    return mapApiAtendimentoToAtendimento(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao atualizar atendimento."));
  }
}

export async function excluirAtendimento(id: string): Promise<void> {
  try {
    await api.delete(`/atendimentos/${id}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao excluir atendimento."));
  }
}
