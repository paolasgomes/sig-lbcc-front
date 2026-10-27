
import { api } from "@/services/api";

export interface VoucherTransporte {
  id: string;
  ordem_transporte_id: string;
  numero_via: number;
  tipo_via: "original" | "segunda_via";
  codigo: string;
  emitido_em: string;
  entregue_em: string | null;
  destinatario: string | null;
}



export interface OrdemTransporte {
  id: string;
  numero: string;
  cotacao_id: string;
  paciente_id: string;
  fornecedor_id: string;
  veiculo_placa: string | null;
  tipo_combustivel: string | null;
  quantidade_autorizada: number | null;
  posto_abastecimento: string | null;
  data_emissao: string | null;
  validade_ate: string | null;
  observacoes: string | null;
  status: string;
  created_at?: string;
  cotacao?: Record<string, unknown> | null;
  paciente?: Record<string, unknown> | null;
  fornecedor?: Record<string, unknown> | null;
  vouchers?: VoucherTransporte[];
  voucher?: VoucherTransporte;
}



export interface EmitirOrdemTransporteInput {
  cotacao_id: string;
  veiculo_placa?: string;
  tipo_combustivel: string;
  quantidade_autorizada: number;
  posto_abastecimento: string;
  validade_ate: string;
  observacoes?: string;
}

export async function emitirOrdemTransporte(
  dados: EmitirOrdemTransporteInput,
): Promise<OrdemTransporte> {
  const response = await api.post(
    "/transporte/ordens",
    dados,
  );

  return response.data;
}

export interface AtualizarOrdemTransporteInput {
  veiculo_placa: string | null;
  tipo_combustivel: string | null;
  quantidade_autorizada: number | null;
  posto_abastecimento: string | null;
  validade_ate: string | null;
  observacoes: string | null;
}

export async function listarOrdensDeTransporte(): Promise<OrdemTransporte[]> {
  const response = await api.get("/transporte/ordens");
  return response.data;
}

export async function obterOrdemDeTransporte(
  id: string,
): Promise<OrdemTransporte> {
  const response = await api.get(`/transporte/ordens/${id}`);
  return response.data;
}

export async function listarVouchersTransporte(
  ordemId: string,
): Promise<VoucherTransporte[]> {
  const response = await api.get(
    `/transporte/ordens/${ordemId}/vouchers`,
  );

  return response.data;
}
export async function atualizarOrdemDeTransporte(
  id: string,
  dados: Partial<AtualizarOrdemTransporteInput>,
): Promise<OrdemTransporte> {
  const response = await api.patch(`/transporte/ordens/${id}`, dados);
  return response.data;
}

export async function emitirSegundaViaVoucher(
  ordemId: string,
): Promise<OrdemTransporte> {
  const response = await api.post(
    `/transporte/ordens/${ordemId}/vouchers/segunda-via`,
  );

  return response.data;
}

export async function registrarEntregaVoucher(
  ordemId: string,
  voucherId: string,
  destinatario: string,
): Promise<unknown> {
  const response = await api.post(
    `/transporte/ordens/${ordemId}/vouchers/${voucherId}/entrega`,
    { destinatario },
  );

  return response.data;
}

export async function baixarPdfVoucherTransporte(
  ordemId: string,
  voucherId: string,
): Promise<{ blob: Blob; filename: string }> {
  const response = await api.get(
    `/transporte/ordens/${ordemId}/vouchers/${voucherId}/pdf`,
    { responseType: "blob" },
  );

  const disposition = String(
    response.headers["content-disposition"] ?? "",
  );

  const filename =
    disposition.match(/filename="?([^";]+)"?/i)?.[1] ??
    "voucher-transporte.pdf";

  return {
    blob: response.data,
    filename,
  };
}
