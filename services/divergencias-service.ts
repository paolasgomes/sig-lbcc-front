import { api } from '@/services/api';

export type TipoOrdemDivergencia = 'OF' | 'OT';
export type TipoDivergencia =
  | 'erro_administrativo'
  | 'fornecimento_parcial'
  | 'atraso_pendencia'
  | 'voucher_perdido_recusado'
  | 'execucao_inviavel'
  | 'quantidade_excedente'
  | 'posto_divergente'
  | 'outro';
export type StatusDivergencia = 'aberta' | 'em_tratamento' | 'resolvida' | 'encerrada_sem_solucao';

export interface EvidenciaDivergencia {
  id: string;
  nome_arquivo: string;
  content_type: string;
  tamanho_bytes: number;
  created_at: string;
}

export interface Divergencia {
  id: string;
  ordem_fornecimento_id: string | null;
  ordem_transporte_id: string | null;
  tipo: TipoDivergencia;
  descricao: string;
  dados_detectados: Record<string, unknown>;
  identificado_em: string;
  registrado_por: string;
  impeditiva: boolean;
  status: StatusDivergencia;
  resolucao_comprovacao: string | null;
  resolucao_justificativa: string | null;
  created_at: string;
  updated_at: string;
  ordem?: { id: string; numero: string; status: string; paciente_id: string } | null;
  eventos?: Array<Record<string, unknown>>;
  providencias?: Array<Record<string, unknown> & { evidencias?: EvidenciaDivergencia[] }>;
  evidencias?: EvidenciaDivergencia[];
  cancelamentos?: SolicitacaoCancelamento[];
  vouchers?: Array<Record<string, unknown>>;
}

export interface SolicitacaoCancelamento {
  id: string;
  divergencia_id: string;
  ordem_fornecimento_id: string | null;
  ordem_transporte_id: string | null;
  status: 'solicitada' | 'aprovada' | 'recusada';
  motivo: string;
  justificativa_decisao: string | null;
  solicitado_por: string;
  decidido_por: string | null;
  solicitado_em: string;
  decidido_em: string | null;
}

export async function listarDivergencias(filters: {
  tipo_ordem?: TipoOrdemDivergencia;
  ordem_id?: string;
  tipo?: string;
  status?: string;
  impeditiva?: boolean;
} = {}): Promise<Divergencia[]> {
  const response = await api.get('/divergencias', { params: filters });
  return response.data;
}

export async function obterDivergencia(id: string): Promise<Divergencia> {
  const response = await api.get(`/divergencias/${id}`);
  return response.data;
}

export async function criarDivergencia(values: {
  tipo_ordem: TipoOrdemDivergencia;
  ordem_id: string;
  tipo: TipoDivergencia;
  descricao: string;
  impeditiva: boolean;
  idempotencyKey: string;
}) {
  const { idempotencyKey, ...body } = values;
  const response = await api.post('/divergencias', body, { headers: { 'Idempotency-Key': idempotencyKey } });
  return response.data as { id: string; divergencia: Divergencia; repetida?: boolean };
}

export async function transicionarDivergencia(id: string, values: {
  status: StatusDivergencia;
  justificativa: string;
  comprovacao?: string;
}) {
  const response = await api.patch(`/divergencias/${id}/status`, values);
  return response.data as Divergencia;
}

export async function registrarProvidencia(id: string, values: {
  descricao: string;
  observacoes: string;
  responsavel_id?: string;
  previsao_regularizacao?: string;
  evidencias: File[];
}) {
  const body = new FormData();
  body.append('descricao', values.descricao);
  body.append('observacoes', values.observacoes);
  if (values.responsavel_id) body.append('responsavel_id', values.responsavel_id);
  if (values.previsao_regularizacao) {
    const previsao = new Date(values.previsao_regularizacao);
    if (!Number.isNaN(previsao.getTime())) body.append('previsao_regularizacao', previsao.toISOString());
  }
  for (const file of values.evidencias) body.append('evidencias', file);
  const response = await api.post(`/divergencias/${id}/providencias`, body);
  return response.data;
}

export async function anexarEvidencias(id: string, files: File[], providenciaId?: string) {
  const body = new FormData();
  for (const file of files) body.append('evidencias', file);
  const url = providenciaId
    ? `/divergencias/${id}/providencias/${providenciaId}/evidencias`
    : `/divergencias/${id}/evidencias`;
  const response = await api.post(url, body);
  return response.data;
}

export async function alterarImpedimento(id: string, values: { impeditiva: boolean; justificativa: string }) {
  const response = await api.patch(`/divergencias/${id}/impeditiva`, values);
  return response.data as Divergencia;
}

export async function corrigirOrdem(id: string, values: { campos: Record<string, unknown>; justificativa: string }) {
  const response = await api.post(`/divergencias/${id}/correcoes`, values);
  return response.data;
}

export async function substituirVoucher(id: string, values: { voucher_id: string; justificativa: string }) {
  const response = await api.post(`/divergencias/${id}/vouchers/substituir`, values);
  return response.data;
}

export async function solicitarCancelamento(id: string, motivo: string) {
  const response = await api.post(`/divergencias/${id}/cancelamentos`, { motivo });
  return response.data as SolicitacaoCancelamento;
}

export async function listarSolicitacoesCancelamento(): Promise<SolicitacaoCancelamento[]> {
  const response = await api.get('/divergencias/cancelamentos');
  return response.data;
}

export async function decidirCancelamento(id: string, values: { aprovado: boolean; justificativa: string }) {
  const response = await api.patch(`/divergencias/cancelamentos/${id}/decisao`, values);
  return response.data as SolicitacaoCancelamento;
}
