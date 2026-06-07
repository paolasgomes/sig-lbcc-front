import { describe, it, expect } from "vitest";
import { mapApiHistoricoToHistoricoPaciente } from "./historico-service";

describe("mapApiHistoricoToHistoricoPaciente", () => {
  it("maps snake_case api dto to camelCase historico", () => {
    expect(
      mapApiHistoricoToHistoricoPaciente({
        id: "h-1",
        paciente_id: "p-1",
        tipo_evento: "ATENDIMENTO",
        descricao: "Consulta realizada",
        referencia_id: "a-1",
        created_at: "2026-06-07T10:00:00Z",
        usuarios: { id: "u-1", nome: "Gestor", email: "gestor@email.com" },
      }),
    ).toEqual({
      id: "h-1",
      pacienteId: "p-1",
      tipoEvento: "ATENDIMENTO",
      descricao: "Consulta realizada",
      referenciaId: "a-1",
      criadoEm: "2026-06-07T10:00:00Z",
      usuarioNome: "Gestor",
    });
  });
});
