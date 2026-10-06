import axios from "axios";
import { api } from "@/services/api";
import { getFriendlyApiError } from "@/lib/api-errors";

export interface NotificacaoDados {
  ordem?: { id: string; numero: string };
  paciente?: { id: string; nome: string };
  fornecedor?: { id: string; nome: string };
  cotacao?: { id: string; numero: string };
  data_limite?: string | null;
  status_prazo?: string | null;
  link?: string;
}

export interface NotificacaoInterna {
  id: string;
  destinatarioId: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  dados: NotificacaoDados;
  ordemFornecimentoId: string | null;
  prazoCiclo: number | null;
  dataLimite: string | null;
  statusPrazo: string | null;
  lidaEm: string | null;
  arquivadaEm: string | null;
  criadoEm: string;
}

export interface ApiNotificacaoInternaDTO {
  id: string;
  destinatario_id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string | null;
  dados?: NotificacaoDados;
  ordem_fornecimento_id?: string | null;
  prazo_ciclo?: number | null;
  data_limite?: string | null;
  status_prazo?: string | null;
  lida_em?: string | null;
  arquivada_em?: string | null;
  created_at: string;
}

export function mapApiNotificacaoToNotificacao(
  dto: ApiNotificacaoInternaDTO,
): NotificacaoInterna {
  return {
    id: dto.id,
    destinatarioId: dto.destinatario_id,
    tipo: dto.tipo,
    titulo: dto.titulo,
    mensagem: dto.mensagem,
    link: dto.link ?? null,
    dados: dto.dados ?? {},
    ordemFornecimentoId: dto.ordem_fornecimento_id ?? null,
    prazoCiclo: dto.prazo_ciclo ?? null,
    dataLimite: dto.data_limite ?? null,
    statusPrazo: dto.status_prazo ?? null,
    lidaEm: dto.lida_em ?? null,
    arquivadaEm: dto.arquivada_em ?? null,
    criadoEm: dto.created_at,
  };
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string; erro?: string }>(error)) {
    const candidate = error.response?.data?.message ?? error.response?.data?.erro;
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
  }

  return getFriendlyApiError(error, fallback);
}

export async function listarNotificacoes(options: {
  apenasNaoLidas?: boolean;
  incluirArquivadas?: boolean;
} = {}): Promise<NotificacaoInterna[]> {
  try {
    const response = await api.get<ApiNotificacaoInternaDTO[]>("/notificacoes", {
      params: {
        apenas_nao_lidas: options.apenasNaoLidas ?? false,
        incluir_arquivadas: options.incluirArquivadas ?? false,
      },
    });

    return response.data.map(mapApiNotificacaoToNotificacao);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar notificações."));
  }
}

export async function marcarNotificacaoComoLida(id: string) {
  const response = await api.patch<ApiNotificacaoInternaDTO>(
    `/notificacoes/${id}/lida`,
  );
  return mapApiNotificacaoToNotificacao(response.data);
}

export async function arquivarNotificacao(id: string) {
  const response = await api.patch<ApiNotificacaoInternaDTO>(
    `/notificacoes/${id}/arquivar`,
  );
  return mapApiNotificacaoToNotificacao(response.data);
}
