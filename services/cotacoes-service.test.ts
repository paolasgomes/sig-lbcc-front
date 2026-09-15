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
      ativo: true,
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
        orcamentos: [],
      },
    ]);
  });

  it("maps nested orcamentos on each item from snake_case", () => {
    const result = mapApiCotacaoToCotacao({
      id: "uuid-4",
      descricao: "Cotação com orçamento",
      paciente_id: "p-1",
      area_id: "a-1",
      data_validade: "2026-12-31",
      observacoes: null,
      status: "em_andamento",
      motivo_cancelamento: null,
      ativo: true,
      created_at: "2026-06-01T00:00:00Z",
      cotacao_itens: [
        {
          id: "item-1",
          cotacao_id: "uuid-4",
          descricao: "Seringa",
          quantidade: 2,
          unidade: "UN",
          orcamentos: [
            {
              id: "orc-1",
              fornecedor_id: "forn-1",
              fornecedor_nome: "Farmacia Central",
              valor_unitario: 10,
              valor_total: 20,
              selecionada: false,
            },
          ],
        },
        {
          id: "item-2",
          cotacao_id: "uuid-4",
          descricao: "Luva",
          quantidade: 5,
          unidade: "CX",
          orcamentos: [],
        },
      ],
    });

    expect(result.status).toBe("em_andamento");
    expect(result.ativo).toBe(true);
    expect(result.itens[0].orcamentos).toEqual([
      {
        id: "orc-1",
        fornecedorId: "forn-1",
        fornecedorNome: "Farmacia Central",
        valorUnitario: 10,
        valorTotal: 20,
        selecionada: false,
      },
    ]);
    expect(result.itens[1].orcamentos).toEqual([]);
  });

  it("maps selecionada true on the nested orcamento line", () => {
    const result = mapApiCotacaoToCotacao({
      id: "uuid-5",
      descricao: "Cotação com vencedor",
      paciente_id: "p-1",
      area_id: "a-1",
      data_validade: "2026-12-31",
      observacoes: null,
      status: "finalizada",
      motivo_cancelamento: null,
      ativo: true,
      created_at: "2026-06-01T00:00:00Z",
      cotacao_itens: [
        {
          id: "item-1",
          cotacao_id: "uuid-5",
          descricao: "Seringa",
          quantidade: 2,
          unidade: "UN",
          orcamentos: [
            {
              id: "orc-1",
              fornecedor_id: "forn-1",
              fornecedor_nome: "Farmacia Central",
              valor_unitario: 10,
              valor_total: 20,
              selecionada: true,
            },
            {
              id: "orc-2",
              fornecedor_id: "forn-2",
              fornecedor_nome: "Distribuidora Norte",
              valor_unitario: 11,
              valor_total: 22,
              selecionada: false,
            },
          ],
        },
      ],
    });

    expect(result.status).toBe("finalizada");
    expect(result.itens[0].orcamentos).toEqual([
      {
        id: "orc-1",
        fornecedorId: "forn-1",
        fornecedorNome: "Farmacia Central",
        valorUnitario: 10,
        valorTotal: 20,
        selecionada: true,
      },
      {
        id: "orc-2",
        fornecedorId: "forn-2",
        fornecedorNome: "Distribuidora Norte",
        valorUnitario: 11,
        valorTotal: 22,
        selecionada: false,
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
      orcamentos: [],
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
      orcamentos: [],
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
      orcamentos: [],
    });
  });
});
