import { api } from '@/services/api';

export interface ItemComprovacaoOF {
  id: string;
  descricao: string;
  unidade: string | null;
  quantidade_solicitada: number;
  quantidade_entregue: number;
  quantidade_entregue_legado: number;
  quantidade_comprovada: number;
  saldo: number;
  status_atendimento: 'pendente' | 'parcial' | 'integral';
}

export interface EvidenciaOrdem {
  id: string;
  nome_arquivo: string;
  content_type: string;
  tamanho_bytes: number;
  created_at: string;
}

export interface ComprovacaoOF {
  id: string;
  data_execucao: string;
  responsavel_execucao_nome: string | null;
  observacoes: string | null;
  registrado_por: string;
  created_at: string;
  itens: Array<{ ordem_fornecimento_item_id: string; quantidade: number }>;
  evidencias: EvidenciaOrdem[];
}

export interface HistoricoComprovacoesOF {
  itens: ItemComprovacaoOF[];
  comprovacoes: ComprovacaoOF[];
}

export interface UtilizacaoVoucherOT {
  id: string;
  ordem_transporte_id: string;
  voucher_id: string;
  data_utilizacao: string;
  posto_abastecimento: string;
  quantidade: number;
  registrado_por: string;
  created_at: string;
  voucher: { numero_via: number; tipo_via: string; invalidado_em: string | null } | null;
  evidencias: EvidenciaOrdem[];
}

export async function listarComprovacoesOF(ordemId: string): Promise<HistoricoComprovacoesOF> {
  const response = await api.get(`/comprovacoes/of/${ordemId}`);
  return response.data;
}

export async function registrarComprovacaoOF(
  ordemId: string,
  values: {
    data_execucao: string;
    responsavel_execucao_nome: string;
    observacoes: string;
    itens: Array<{ item_id: string; quantidade: number }>;
    evidencias: File[];
    idempotencyKey: string;
  },
): Promise<{ id: string; repetida: boolean }> {
  const body = new FormData();
  body.append('data_execucao', values.data_execucao);
  body.append('responsavel_execucao_nome', values.responsavel_execucao_nome);
  body.append('observacoes', values.observacoes);
  body.append('itens', JSON.stringify(values.itens));
  for (const file of values.evidencias) body.append('evidencias', file);
  const response = await api.post(`/comprovacoes/of/${ordemId}`, body, {
    headers: { 'Idempotency-Key': values.idempotencyKey },
  });
  return response.data;
}

export async function listarUtilizacoesOT(ordemId: string): Promise<UtilizacaoVoucherOT[]> {
  const response = await api.get(`/comprovacoes/ot/${ordemId}`);
  return response.data;
}

export async function registrarUtilizacaoOT(
  ordemId: string,
  values: {
    voucher_id: string;
    data_utilizacao: string;
    posto_abastecimento: string;
    quantidade: number;
    evidencias: File[];
    idempotencyKey: string;
  },
): Promise<{ id: string; repetida: boolean }> {
  const body = new FormData();
  body.append('voucher_id', values.voucher_id);
  body.append('data_utilizacao', values.data_utilizacao);
  body.append('posto_abastecimento', values.posto_abastecimento);
  body.append('quantidade', String(values.quantidade));
  for (const file of values.evidencias) body.append('evidencias', file);
  const response = await api.post(`/comprovacoes/ot/${ordemId}`, body, {
    headers: { 'Idempotency-Key': values.idempotencyKey },
  });
  return response.data;
}

export async function finalizarOrdemTransporte(ordemId: string) {
  const response = await api.patch(`/comprovacoes/ot/${ordemId}/finalizar`);
  return response.data;
}

export async function obterUrlEvidencia(id: string): Promise<string> {
  const response = await api.get(`/comprovacoes/evidencias/${id}/url`);
  return response.data.url;
}
