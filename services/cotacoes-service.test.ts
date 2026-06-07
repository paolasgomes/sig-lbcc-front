import { describe, it, expect } from "vitest";
import { mapApiCotacaoToCotacao, mapApiItemToItemCotacao } from "./cotacoes-service";

describe("mapApiCotacaoToCotacao", () => {
  it("maps snake_case api dto to camelCase cotacao", () => {
    const result = mapApiCotacaoToCotacao({
      id: "uuid-1",
      descricao: "Cotação teste",
      paciente_id: "p-1",
      area_id: "a-1",
      data_validade: "2026-12-31",
      observacoes: "obs",
      ativo: true,
      numero: "COT-001",
      created_at: "2026-06-01T00:00:00Z",
      pacientes: { id: "p-1", nome: "Maria Silva" },
      areas: { id: "a-1", nome: "Quimioterapia" },
    });

    expect(result).toEqual({
      id: "uuid-1",
      descricao: "Cotação teste",
      pacienteId: "p-1",
      areaId: "a-1",
      dataValidade: "2026-12-31",
      observacoes: "obs",
      ativo: true,
      numero: "COT-001",
      criadoEm: "2026-06-01T00:00:00Z",
      pacienteNome: "Maria Silva",
      areaNome: "Quimioterapia",
      itens: [],
    });
  });
});

describe("mapApiItemToItemCotacao", () => {
  it("maps item fields", () => {
    expect(
      mapApiItemToItemCotacao({
        id: "item-1",
        cotacao_id: "c-1",
        descricao: "Seringa",
        quantidade: 10,
        unidade: "UN",
        ordem: 1,
      }),
    ).toEqual({
      id: "item-1",
      descricao: "Seringa",
      quantidade: 10,
      unidade: "UN",
      ordem: 1,
    });
  });

  it("maps produto_id when present", () => {
    expect(
      mapApiItemToItemCotacao({
        id: "item-2",
        cotacao_id: "c-1",
        produto_id: "prod-1",
        descricao: "Água",
        quantidade: 2,
        unidade: "CX",
        ordem: 1,
      }),
    ).toEqual({
      id: "item-2",
      produtoId: "prod-1",
      descricao: "Água",
      quantidade: 2,
      unidade: "CX",
      ordem: 1,
    });
  });
});
