import { describe, expect, it } from "vitest";
import { mapApiNotificacaoToNotificacao } from "./notificacoes-service";

describe("mapApiNotificacaoToNotificacao", () => {
  it("maps a notification snapshot and read state", () => {
    expect(mapApiNotificacaoToNotificacao({
      id: "n-1",
      destinatario_id: "u-1",
      tipo: "OF_PROXIMA_EXPIRACAO",
      titulo: "Ordem próxima",
      mensagem: "Prazo próximo",
      link: "/fornecimento/of-1",
      dados: {
        ordem: { id: "of-1", numero: "OF-2026-0001" },
        paciente: { id: "p-1", nome: "Paciente" },
      },
      ordem_fornecimento_id: "of-1",
      prazo_ciclo: 2,
      data_limite: "2026-10-05",
      status_prazo: "proxima_expiracao",
      lida_em: null,
      arquivada_em: null,
      created_at: "2026-10-02T10:00:00Z",
    })).toEqual({
      id: "n-1",
      destinatarioId: "u-1",
      tipo: "OF_PROXIMA_EXPIRACAO",
      titulo: "Ordem próxima",
      mensagem: "Prazo próximo",
      link: "/fornecimento/of-1",
      dados: {
        ordem: { id: "of-1", numero: "OF-2026-0001" },
        paciente: { id: "p-1", nome: "Paciente" },
      },
      ordemFornecimentoId: "of-1",
      prazoCiclo: 2,
      dataLimite: "2026-10-05",
      statusPrazo: "proxima_expiracao",
      lidaEm: null,
      arquivadaEm: null,
      criadoEm: "2026-10-02T10:00:00Z",
    });
  });
});
