import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import { api } from "@/services/api";
import {
  emitirOrdemTransporte,
  type EmitirOrdemTransporteInput,
} from "./transporte-service";

describe("RF_F11 - emissão da ordem de transporte", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia os dados corretos e retorna a OT com seus vouchers", async () => {
    const dados: EmitirOrdemTransporteInput = {
      cotacao_id: "cot-123",
      veiculo_placa: "ABC1D23",
      tipo_combustivel: "gasolina",
      quantidade_autorizada: 40,
      posto_abastecimento: "Posto Central",
      validade_ate: "2026-11-30",
      observacoes: "Abastecimento autorizado",
    };

    const resposta = {
      id: "ot-123",
      numero: "OT-001",
      cotacao_id: "cot-123",
      status: "emitida",
      vouchers: [
        {
          id: "voucher-123",
          ordem_transporte_id: "ot-123",
          numero_via: 1,
          tipo_via: "original",
          codigo: "ABC123",
          emitido_em: "2026-10-28T12:00:00Z",
          entregue_em: null,
          destinatario: null,
        },
      ],
    };

    vi.mocked(api.post).mockResolvedValue({ data: resposta } as never);

    const resultado = await emitirOrdemTransporte(dados);

    expect(api.post).toHaveBeenCalledWith("/transporte/ordens", dados);
    expect(resultado).toEqual(resposta);
    expect(resultado.vouchers).toHaveLength(1);
    expect(resultado.vouchers?.[0].codigo).toBe("ABC123");
  });

  it("propaga o erro quando a API recusa a emissão", async () => {
    const erro = new Error("Cotação inválida");
    vi.mocked(api.post).mockRejectedValue(erro);

    await expect(
      emitirOrdemTransporte({
        cotacao_id: "cot-invalida",
        tipo_combustivel: "gasolina",
        quantidade_autorizada: 40,
        posto_abastecimento: "Posto Central",
        validade_ate: "2026-11-30",
      }),
    ).rejects.toThrow("Cotação inválida");
  });
});
