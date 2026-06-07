import { describe, it, expect } from "vitest";
import {
  getHistoricoCategoria,
  getHistoricoLink,
  getHistoricoCategoriaConfig,
} from "./historico-utils";

describe("getHistoricoCategoria", () => {
  it("maps atendimento event types", () => {
    expect(getHistoricoCategoria("ATENDIMENTO")).toBe("atendimento");
    expect(getHistoricoCategoria("ATENDIMENTO_REGISTRADO")).toBe("atendimento");
    expect(getHistoricoCategoria("ATENDIMENTO_REMOVIDO")).toBe("atendimento");
  });

  it("maps cotacao event types", () => {
    expect(getHistoricoCategoria("COTACAO_CRIADA")).toBe("cotacao");
    expect(getHistoricoCategoria("COTACAO_EDITADA")).toBe("cotacao");
  });

  it("maps status and documento types", () => {
    expect(getHistoricoCategoria("ALTERACAO_STATUS")).toBe("status");
    expect(getHistoricoCategoria("DOCUMENTO_ANEXADO")).toBe("documento");
    expect(getHistoricoCategoria("DOCUMENTO_REMOVIDO")).toBe("documento");
  });

  it("returns outro for unknown types", () => {
    expect(getHistoricoCategoria("UNKNOWN_EVENT")).toBe("outro");
  });
});

describe("getHistoricoLink", () => {
  it("returns atendimento link for atendimento category", () => {
    expect(getHistoricoLink("uuid-1", "ATENDIMENTO")).toBe("/atendimentos/uuid-1");
  });

  it("returns cotacao link for cotacao category", () => {
    expect(getHistoricoLink("uuid-2", "COTACAO_CRIADA")).toBe("/cotacoes/uuid-2");
  });

  it("returns null when referenciaId is missing", () => {
    expect(getHistoricoLink(null, "ATENDIMENTO")).toBeNull();
  });

  it("returns null for categories without links", () => {
    expect(getHistoricoLink("uuid-3", "ALTERACAO_STATUS")).toBeNull();
  });

  it("returns null for removed atendimento events", () => {
    expect(getHistoricoLink("uuid-4", "ATENDIMENTO_REMOVIDO")).toBeNull();
  });

  it("returns null for removed documento events", () => {
    expect(getHistoricoLink("uuid-5", "DOCUMENTO_REMOVIDO")).toBeNull();
  });
});

describe("getHistoricoCategoriaConfig", () => {
  it("returns label and colorClass for each category", () => {
    const config = getHistoricoCategoriaConfig("atendimento");
    expect(config.label).toBe("Atendimento");
    expect(config.colorClass).toContain("bg-");
    expect(config.icon).toBeDefined();
  });
});
