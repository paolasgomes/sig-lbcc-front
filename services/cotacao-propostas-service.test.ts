import { describe, it, expect } from "vitest";

import {
  mapApiPropostaToOrcamento,
} from "./cotacao-propostas-service";

describe("mapApiPropostaToOrcamento", () => {
  it("maps snake_case api dto to camelCase orcamento", () => {
    const result = mapApiPropostaToOrcamento({
      id: "prop-1",
      cotacao_id: "cot-1",
      fornecedor_id: "forn-1",
      data_proposta: "2026-09-13",
      validade_proposta: "2026-09-20",
      valor_total: 150.5,
      prazo_entrega: "5 dias",
      condicoes_pagamento: "30 dias",
      observacoes: "Entrega no endereço informado.",
      selecionada: false,
      created_by: "user-1",
      created_at: "2026-09-13T10:00:00Z",
      updated_at: "2026-09-13T10:00:00Z",

      cotacao: {
        id: "cot-1",
        descricao: "Cotação de medicamentos",
      },

      fornecedor: {
        id: "forn-1",
        razao_social: "Distribuidora ABC Ltda",
        nome_fantasia: "ABC Med",
      },

      cotacao_proposta_itens: [
        {
          id: "prop-item-1",
          proposta_id: "prop-1",
          item_id: "item-1",
          valor_unitario: 10.5,
          valor_total: 105,
          observacoes: "Marca solicitada",
        },
      ],
    });

    expect(result).toEqual({
      id: "prop-1",
      cotacaoId: "cot-1",
      fornecedorId: "forn-1",
      dataProposta: "2026-09-13",
      validadeProposta: "2026-09-20",
      valorTotal: 150.5,
      prazoEntrega: "5 dias",
      condicoesPagamento: "30 dias",
      observacoes: "Entrega no endereço informado.",
      selecionada: false,
      criadoEm: "2026-09-13T10:00:00Z",

      cotacaoNome: "Cotação de medicamentos",
      fornecedorNome: "ABC Med",

      itens: [
        {
          id: "prop-item-1",
          itemId: "item-1",
          valorUnitario: 10.5,
          valorTotal: 105,
          observacoes: "Marca solicitada",
        },
      ],
    });
  });

  it("uses razao_social when nome_fantasia is not available", () => {
    const result = mapApiPropostaToOrcamento({
      id: "prop-2",
      cotacao_id: "cot-2",
      fornecedor_id: "forn-2",
      data_proposta: "2026-09-13",
      validade_proposta: null,
      valor_total: 200,
      prazo_entrega: null,
      condicoes_pagamento: null,
      observacoes: null,
      selecionada: false,
      created_by: null,
      created_at: "2026-09-13T11:00:00Z",
      updated_at: "2026-09-13T11:00:00Z",

      fornecedor: {
        id: "forn-2",
        razao_social: "Fornecedor XYZ Ltda",
        nome_fantasia: null,
      },
    });

    expect(result.fornecedorNome).toBe(
      "Fornecedor XYZ Ltda",
    );
  });

  it("maps optional fields correctly when they are null", () => {
    const result = mapApiPropostaToOrcamento({
      id: "prop-3",
      cotacao_id: "cot-3",
      fornecedor_id: "forn-3",
      data_proposta: "2026-09-13",
      validade_proposta: null,
      valor_total: 0,
      prazo_entrega: null,
      condicoes_pagamento: null,
      observacoes: null,
      selecionada: false,
      created_at: "2026-09-13T12:00:00Z",
      updated_at: "2026-09-13T12:00:00Z",
    });

    expect(result).toEqual({
      id: "prop-3",
      cotacaoId: "cot-3",
      fornecedorId: "forn-3",
      dataProposta: "2026-09-13",
      validadeProposta: undefined,
      valorTotal: 0,
      prazoEntrega: undefined,
      condicoesPagamento: undefined,
      observacoes: "",
      selecionada: false,
      criadoEm: "2026-09-13T12:00:00Z",
      cotacaoNome: undefined,
      fornecedorNome: undefined,
      itens: [],
    });
  });
});