import { describe, expect, it } from "vitest";
import { mapApiLembreteFornecedor } from "./lembretes-fornecedor-service";

describe("mapApiLembreteFornecedor", () => {
  it("maps status, last recipient and attempts without exposing patient data", () => {
    const result = mapApiLembreteFornecedor({
      id: "l-1",
      ordem_fornecimento_id: "of-1",
      prazo_ciclo: 2,
      status: "falha_recuperavel",
      tentativas_realizadas: 1,
      proxima_tentativa_em: "2026-10-02T10:30:00Z",
      ultima_tentativa_em: "2026-10-02T10:00:00Z",
      ultimo_destinatario_email: "contato@fornecedor.test",
      ultimo_erro: "SMTP temporariamente indisponivel",
      created_at: "2026-10-02T09:00:00Z",
      updated_at: "2026-10-02T10:00:00Z",
      tentativas: [
        {
          id: "t-1",
          numero_tentativa: 1,
          status: "falha_recuperavel",
          destinatario_email: "contato@fornecedor.test",
          erro: "SMTP temporariamente indisponivel",
          metadados: { retryable: true },
          iniciado_em: "2026-10-02T10:00:00Z",
          finalizado_em: "2026-10-02T10:00:01Z",
          created_at: "2026-10-02T10:00:00Z",
        },
      ],
    });

    expect(result).toMatchObject({
      id: "l-1",
      ordemFornecimentoId: "of-1",
      status: "falha_recuperavel",
      tentativasRealizadas: 1,
      ultimoDestinatarioEmail: "contato@fornecedor.test",
      tentativas: [{ numero_tentativa: 1, destinatario_email: "contato@fornecedor.test" }],
    });
    expect(result).not.toHaveProperty("paciente");
  });
});
