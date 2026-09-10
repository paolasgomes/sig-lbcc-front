import { describe, it, expect } from "vitest";
import {
  mapApiCotacaoToCotacao,
  mapApiItemToItemCotacao,
} from "./cotacoes-service";

describe("mapApiCotacaoToCotacao", () => {
  it("maps snake_case api dto to camelCase cotacao", () => {
    const result = mapApiCotacaoToCotacao({
      id: "uuid-1",
      descricao: "Cotação teste",
      paciente_id: "p-1",
      area_id: "a-1",
      data_validade: "2026-12-31",
      observacoes: "obs",
      status: "aberta",
      motivo_cancelamento: null,
      numero: "COT-001",
      created_at: "2026-06-01T00:00:00Z",
      pacientes: {
        id: "p-1",
        nome: "Maria Silva",
      },
      areas: {
        id: "a-1",
        nome: "Quimioterapia",
      },
    });

    expect(result).toEqual({
      id: "uuid-1",
      descricao: "Cotação teste",
      pacienteId: "p-1",
      areaId: "a-1",
      dataValidade: "2026-12-31",
      observacoes: "obs",
      status: "aberta",
      motivoCancelamento: null,
      numero: "COT-001",
      criadoEm: "2026-06-01T00:00:00Z",
      atualizadoEm: undefined,
      pacienteNome: "Maria Silva",
      areaNome: "Quimioterapia",
      itens: [],
    });
  });

  it("maps cotacao_itens when returned by the api", () => {
    const result = mapApiCotacaoToCotacao({
      id: "uuid-2",
      descricao: "Cotação com itens",
      paciente_id: "p-1",
      area_id: "a-1",
      data_validade: "2026-12-31",
      observacoes: null,
      status: "aberta",
      motivo_cancelamento: null,
      created_at: "2026-06-01T00:00:00Z",
      cotacao_itens: [
        {
          id: "item-1",
          cotacao_id: "uuid-2",
          produto_id: "prod-1",
          descricao: "Seringa",
          quantidade: 10,
          unidade: "UN",
          especificacoes: "10ml",
          ordem: 1,
        },
      ],
    });

    expect(result.itens).toEqual([
      {
        id: "item-1",
        cotacaoId: "uuid-2",
        produtoId: "prod-1",
        descricao: "Seringa",
        quantidade: 10,
        unidade: "UN",
        especificacoes: "10ml",
        ordem: 1,
      },
    ]);
  });

  it("maps motivo de cancelamento", () => {
    const result = mapApiCotacaoToCotacao({
      id: "uuid-3",
      descricao: "Cotação cancelada",
      paciente_id: "p-1",
      area_id: "a-1",
      data_validade: "2026-12-31",
      observacoes: null,
      status: "cancelada",
      motivo_cancelamento: "Fornecedor não respondeu",
      created_at: "2026-06-01T00:00:00Z",
    });

    expect(result.status).toBe("cancelada");
    expect(result.motivoCancelamento).toBe(
      "Fornecedor não respondeu",
    );
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
      cotacaoId: "c-1",
      produtoId: undefined,
      descricao: "Seringa",
      quantidade: 10,
      unidade: "UN",
      especificacoes: undefined,
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
      cotacaoId: "c-1",
      produtoId: "prod-1",
      descricao: "Água",
      quantidade: 2,
      unidade: "CX",
      especificacoes: undefined,
      ordem: 1,
    });
  });

  it("maps especificacoes when present", () => {
    expect(
      mapApiItemToItemCotacao({
        id: "item-3",
        cotacao_id: "c-1",
        produto_id: "prod-1",
        descricao: "Seringa",
        quantidade: 5,
        unidade: "UN",
        especificacoes: "10ml, descartável",
        ordem: 1,
      }),
    ).toEqual({
      id: "item-3",
      cotacaoId: "c-1",
      produtoId: "prod-1",
      descricao: "Seringa",
      quantidade: 5,
      unidade: "UN",
      especificacoes: "10ml, descartável",
      ordem: 1,
    });
  });
});
