import axios from "axios";
import { api } from "@/services/api";
import { getFriendlyApiError } from "@/lib/api-errors";

export type StatusLembreteFornecedor =
  | "pendente"
  | "enviado"
  | "falha_recuperavel"
  | "falha_definitiva";

export interface TentativaLembreteFornecedor {
  id: string;
  numero_tentativa: number;
  status: string;
  destinatario_email: string | null;
  erro: string | null;
  metadados: Record<string, unknown>;
  iniciado_em: string;
  finalizado_em: string | null;
  created_at: string;
}

export interface ApiLembreteFornecedorDTO {
  id: string;
  ordem_fornecimento_id: string;
  prazo_ciclo: number;
  status: StatusLembreteFornecedor;
  tentativas_realizadas: number;
  proxima_tentativa_em: string | null;
  ultima_tentativa_em: string | null;
  ultimo_destinatario_email: string | null;
  ultimo_erro: string | null;
  ultimo_metadado?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  tentativas?: TentativaLembreteFornecedor[];
}

export interface LembreteFornecedor {
  id: string;
  ordemFornecimentoId: string;
  prazoCiclo: number;
  status: StatusLembreteFornecedor;
  tentativasRealizadas: number;
  proximaTentativaEm: string | null;
  ultimaTentativaEm: string | null;
  ultimoDestinatarioEmail: string | null;
  ultimoErro: string | null;
  ultimoMetadado: Record<string, unknown>;
  criadoEm: string;
  atualizadoEm: string;
  tentativas: TentativaLembreteFornecedor[];
}

export function mapApiLembreteFornecedor(
  dto: ApiLembreteFornecedorDTO,
): LembreteFornecedor {
  return {
    id: dto.id,
    ordemFornecimentoId: dto.ordem_fornecimento_id,
    prazoCiclo: dto.prazo_ciclo,
    status: dto.status,
    tentativasRealizadas: dto.tentativas_realizadas,
    proximaTentativaEm: dto.proxima_tentativa_em,
    ultimaTentativaEm: dto.ultima_tentativa_em,
    ultimoDestinatarioEmail: dto.ultimo_destinatario_email,
    ultimoErro: dto.ultimo_erro,
    ultimoMetadado: dto.ultimo_metadado ?? {},
    criadoEm: dto.created_at,
    atualizadoEm: dto.updated_at,
    tentativas: dto.tentativas ?? [],
  };
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string; erro?: string }>(error)) {
    const candidate = error.response?.data?.message ?? error.response?.data?.erro;
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
  }

  return getFriendlyApiError(error, fallback);
}

export async function obterLembreteFornecedor(
  ordemId: string,
): Promise<LembreteFornecedor | null> {
  try {
    const response = await api.get<ApiLembreteFornecedorDTO>(
      `/fornecimento/${ordemId}/lembrete-fornecedor`,
    );
    return mapApiLembreteFornecedor(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw new Error(getApiErrorMessage(error, "Erro ao carregar o lembrete ao fornecedor."));
  }
}

export async function reenviarLembreteFornecedor(
  ordemId: string,
): Promise<LembreteFornecedor> {
  try {
    const response = await api.post<ApiLembreteFornecedorDTO>(
      `/fornecimento/${ordemId}/lembrete-fornecedor/reenvio`,
    );
    return mapApiLembreteFornecedor(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao reenviar o lembrete ao fornecedor."));
  }
}
