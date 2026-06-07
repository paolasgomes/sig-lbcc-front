import { describe, it, expect } from "vitest";
import { getTipoAtendimentoLabel, formatDataAtendimento } from "./atendimentos-utils";

describe("getTipoAtendimentoLabel", () => {
  it("returns Portuguese label for known tipo", () => {
    expect(getTipoAtendimentoLabel("consulta")).toBe("Consulta");
    expect(getTipoAtendimentoLabel("internacao")).toBe("Internação");
    expect(getTipoAtendimentoLabel("quimioterapia")).toBe("Quimioterapia");
  });

  it("returns raw value for unknown tipo", () => {
    expect(getTipoAtendimentoLabel("desconhecido")).toBe("desconhecido");
  });
});

describe("formatDataAtendimento", () => {
  it("formats yyyy-MM-dd to dd/MM/yyyy", () => {
    expect(formatDataAtendimento("2026-06-07")).toBe("07/06/2026");
  });

  it("returns input when date is invalid", () => {
    expect(formatDataAtendimento("invalid")).toBe("invalid");
  });
});
