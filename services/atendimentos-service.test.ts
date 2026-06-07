import { describe, it, expect } from "vitest";
import { mapApiAtendimentoToAtendimento } from "./atendimentos-service";

describe("mapApiAtendimentoToAtendimento", () => {
  it("maps snake_case api dto to camelCase atendimento", () => {
    const result = mapApiAtendimentoToAtendimento({
      id: "uuid-1",
      paciente_id: "p-1",
      tipo: "consulta",
      data_atendimento: "2026-06-07",
      descricao: "Consulta de rotina",
      created_at: "2026-06-07T10:00:00Z",
      updated_at: "2026-06-08T10:00:00Z",
      created_by: "u-1",
      pacientes: { id: "p-1", nome: "Maria Silva" },
    });

    expect(result).toEqual({
      id: "uuid-1",
      pacienteId: "p-1",
      tipo: "consulta",
      dataAtendimento: "2026-06-07",
      descricao: "Consulta de rotina",
      criadoEm: "2026-06-07T10:00:00Z",
      atualizadoEm: "2026-06-08T10:00:00Z",
      pacienteNome: "Maria Silva",
      criadoPorNome: undefined,
    });
  });
});
