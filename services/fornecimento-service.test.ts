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
  finalizarOrdemDeFornecimento,
  reenviarReciboFinalizacaoOrdemDeFornecimento,
} from "./fornecimento-service";

describe("RF_F9 - finalização da ordem de fornecimento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finaliza a OF pela rota correta e retorna os dados da resposta", async () => {
    const ordem = { id: "of-123", status: "finalizada" };
    vi.mocked(api.patch).mockResolvedValue({ data: ordem } as never);

    const resultado = await finalizarOrdemDeFornecimento("of-123");

    expect(api.patch).toHaveBeenCalledWith("/fornecimento/of-123/finalizar");
    expect(resultado).toEqual(ordem);
  });

  it("solicita o reenvio do recibo e retorna a resposta da API", async () => {
    const resposta = {
      message: "Recibo reenviado",
      data: { ordemId: "of-123" },
    };
    vi.mocked(api.post).mockResolvedValue({ data: resposta } as never);

    const resultado =
      await reenviarReciboFinalizacaoOrdemDeFornecimento("of-123");

    expect(api.post).toHaveBeenCalledWith(
      "/fornecimento/of-123/recibo/reenvio",
    );
    expect(resultado).toEqual(resposta);
  });

  it("propaga o erro quando a API falha ao finalizar a OF", async () => {
    const erro = new Error("Falha na API");
    vi.mocked(api.patch).mockRejectedValue(erro);

    await expect(
      finalizarOrdemDeFornecimento("of-123"),
    ).rejects.toThrow("Falha na API");
  });
});
