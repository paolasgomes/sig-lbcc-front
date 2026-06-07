import axios from "axios";
import { api } from "./api";
import { getFriendlyApiError } from "@/lib/api-errors";
import type { HistoricoPaciente } from "@/types";

export interface ApiHistoricoPacienteDTO {
  id: string;
  paciente_id: string;
  tipo_evento: string;
  descricao: string;
  referencia_id?: string | null;
  created_at: string;
  usuarios?: { id: string; nome: string; email: string } | null;
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
  }

  return getFriendlyApiError(error, fallback);
}

export function mapApiHistoricoToHistoricoPaciente(
  dto: ApiHistoricoPacienteDTO,
): HistoricoPaciente {
  return {
    id: dto.id,
    pacienteId: dto.paciente_id,
    tipoEvento: dto.tipo_evento,
    descricao: dto.descricao ?? "",
    referenciaId: dto.referencia_id ?? null,
    criadoEm: dto.created_at,
    usuarioNome: dto.usuarios?.nome,
  };
}

export async function listarHistoricoPaciente(
  pacienteId: string,
): Promise<HistoricoPaciente[]> {
  try {
    const response = await api.get<ApiHistoricoPacienteDTO[]>(
      "/historico-pacientes",
      { params: { paciente_id: pacienteId } },
    );
    return response.data.map(mapApiHistoricoToHistoricoPaciente);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar histórico."));
  }
}
