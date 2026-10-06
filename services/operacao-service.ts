import axios from "axios";
import { api } from "@/services/api";
import { getFriendlyApiError } from "@/lib/api-errors";

export type AutomacaoJob = "proximidade" | "atraso" | "lembretes_fornecedor";
export type StatusExecucaoAutomacao =
  | "executando"
  | "concluida"
  | "concluida_com_falhas"
  | "falha"
  | "ignorada";

export interface AutomacaoExecucao {
  id: string;
  job_nome: AutomacaoJob;
  origem: "automatico" | "manual";
  solicitante_id: string | null;
  status: StatusExecucaoAutomacao;
  iniciado_em: string;
  finalizado_em: string | null;
  ordens_examinadas: number;
  ordens_afetadas: number;
  notificacoes_criadas: number;
  emails_enviados: number;
  falhas: number;
  retentativas: number;
  inconsistencias: number;
  resumo: Record<string, unknown>;
  erro: string | null;
}

export interface PendenciaAdministrativa {
  id: string;
  chave: string;
  tipo: string;
  ordem_fornecimento_id: string | null;
  status: "pendente" | "resolvida" | "ignorada";
  descricao: string;
  dados: Record<string, unknown>;
  ocorrencias: number;
  primeira_ocorrencia_em: string;
  ultima_ocorrencia_em: string;
}

export interface ResultadoProcessamentoManual {
  status: "concluida" | "concluida_com_falhas";
  solicitanteId: string;
  jobs: AutomacaoJob[];
  resumo: {
    ordensExaminadas: number;
    ordensAfetadas: number;
    notificacoesCriadas: number;
    emailsEnviados: number;
    falhas: number;
    retentativas: number;
    inconsistencias: number;
  };
  execucoes: Array<Partial<AutomacaoExecucao> & { jobNome?: AutomacaoJob; error?: string }>;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string; erro?: string }>(error)) {
    const candidate = error.response?.data?.message ?? error.response?.data?.erro;
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
  }

  return getFriendlyApiError(error, fallback);
}

export async function processarPrazosManualmente(
  jobs?: AutomacaoJob[],
): Promise<ResultadoProcessamentoManual> {
  try {
    const response = await api.post<ResultadoProcessamentoManual>(
      "/operacao/automacao/prazos/processar",
      jobs ? { jobs } : {},
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao processar os prazos manualmente."));
  }
}

export async function listarExecucoesAutomacao(): Promise<AutomacaoExecucao[]> {
  try {
    const response = await api.get<AutomacaoExecucao[]>("/operacao/automacao/execucoes");
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar as execuções da automação."));
  }
}

export async function listarPendenciasAdministrativas(): Promise<PendenciaAdministrativa[]> {
  try {
    const response = await api.get<PendenciaAdministrativa[]>("/operacao/automacao/pendencias");
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar as pendências administrativas."));
  }
}
