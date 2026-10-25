
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
  tipo_combustivel: string;
  quantidade_autorizada: number;
  posto_abastecimento: string;
  data_emissao: string;
  validade_ate: string;
  observacoes: string | null;
  status: string;
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
