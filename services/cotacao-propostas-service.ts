import axios from "axios";

import { api } from "./api";

import { getFriendlyApiError } from "@/lib/api-errors";

import type {
  Orcamento,
  OrcamentoItem,
  OrcamentoCreateInput,
  OrcamentoUpdateInput,
} from "@/types";

export interface ApiCotacaoPropostaItemDTO {
  id: string;
  proposta_id: string;
  item_id: string;
  valor_unitario: number;
  valor_total: number;
  observacoes?: string | null;
}

export interface ApiCotacaoPropostaDTO {
  id: string;
  cotacao_id: string;
  fornecedor_id: string;
  data_proposta: string;
  validade_proposta?: string | null;
  valor_total: number;
  prazo_entrega?: string | null;
  condicoes_pagamento?: string | null;
  observacoes?: string | null;
  selecionada: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  cotacao?: {
    id: string;
    descricao: string;
  } | null;

  fornecedor?: {
    id: string;
    razao_social?: string | null;
    nome_fantasia?: string | null;
  } | null;

  cotacao_proposta_itens?: ApiCotacaoPropostaItemDTO[];
}

export interface ItemOrcamentoInput {
  itemId: string;
  valorUnitario: number;
  observacoes?: string;
}

interface ApiErrorBody {
  erro?: string;
  error?: string;
  message?: string;
}

function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;

    const candidate =
      data?.erro ??
      data?.error ??
      data?.message;

    if (
      typeof candidate === "string" &&
      candidate.length > 0
    ) {
      return candidate;
    }

    if (error.response?.status === 403) {
      return "Você não tem permissão para realizar esta ação.";
    }
  }

  return getFriendlyApiError(error, fallback);
}

function mapApiItemToOrcamentoItem(
  item: ApiCotacaoPropostaItemDTO,
): OrcamentoItem {
  return {
    id: item.id,
    itemId: item.item_id,
    valorUnitario: Number(item.valor_unitario ?? 0),
    valorTotal: Number(item.valor_total ?? 0),
    observacoes: item.observacoes ?? "",
  };
}

export function mapApiPropostaToOrcamento(
  proposta: ApiCotacaoPropostaDTO,
): Orcamento {
  return {
    id: proposta.id,
    cotacaoId: proposta.cotacao_id,
    fornecedorId: proposta.fornecedor_id,
    dataProposta: proposta.data_proposta,
    validadeProposta:
      proposta.validade_proposta ?? undefined,
    valorTotal: Number(proposta.valor_total ?? 0),
    prazoEntrega:
      proposta.prazo_entrega ?? undefined,
    condicoesPagamento:
      proposta.condicoes_pagamento ?? undefined,
    observacoes: proposta.observacoes ?? "",
    selecionada: proposta.selecionada ?? false,
    criadoEm: proposta.created_at,

    cotacaoNome: proposta.cotacao?.descricao,

    fornecedorNome:
      proposta.fornecedor?.nome_fantasia ??
      proposta.fornecedor?.razao_social ??
      undefined,

    itens:
      proposta.cotacao_proposta_itens?.map(
        mapApiItemToOrcamentoItem,
      ) ?? [],
  };
}

function mapOrcamentoToApiPayload(
  dados: OrcamentoCreateInput,
) {
  return {
    cotacao_id: dados.cotacaoId,
    fornecedor_id: dados.fornecedorId,
    data_proposta: dados.dataProposta,
    validade_proposta:
      dados.validadeProposta || null,
    prazo_entrega:
      dados.prazoEntrega || null,
    condicoes_pagamento:
      dados.condicoesPagamento || null,
    observacoes:
      dados.observacoes || null,

    itens: dados.itens.map((item) => ({
      item_id: item.itemId,
      valor_unitario: Number(item.valorUnitario),
      observacoes:
        item.observacoes || null,
    })),
  };
}

export async function listarOrcamentos(
  cotacaoId?: string,
): Promise<Orcamento[]> {
  try {
    const response =
      await api.get<ApiCotacaoPropostaDTO[]>(
        "/cotacao-propostas",
        {
          params: cotacaoId
            ? { cotacao_id: cotacaoId }
            : undefined,
        },
      );

    return response.data.map(
      mapApiPropostaToOrcamento,
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Erro ao carregar orçamentos.",
      ),
    );
  }
}

export async function obterOrcamento(
  id: string,
): Promise<Orcamento> {
  try {
    const response =
      await api.get<ApiCotacaoPropostaDTO>(
        `/cotacao-propostas/${id}`,
      );

    return mapApiPropostaToOrcamento(
      response.data,
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Erro ao carregar orçamento.",
      ),
    );
  }
}

export async function criarOrcamento(
  dados: OrcamentoCreateInput,
): Promise<Orcamento> {
  try {
    const response =
      await api.post<ApiCotacaoPropostaDTO>(
        "/cotacao-propostas",
        mapOrcamentoToApiPayload(dados),
      );

    return mapApiPropostaToOrcamento(
      response.data,
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Erro ao criar orçamento.",
      ),
    );
  }
}

export async function atualizarOrcamento(
  id: string,
  dados: OrcamentoUpdateInput,
): Promise<Orcamento> {
  try {
    const response =
      await api.put<ApiCotacaoPropostaDTO>(
        `/cotacao-propostas/${id}`,
        {
          fornecedor_id:
            dados.fornecedorId,

          data_proposta:
            dados.dataProposta,

          validade_proposta:
            dados.validadeProposta || null,

          prazo_entrega:
            dados.prazoEntrega || null,

          condicoes_pagamento:
            dados.condicoesPagamento || null,

          observacoes:
            dados.observacoes || null,
        },
      );

    return mapApiPropostaToOrcamento(
      response.data,
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Erro ao atualizar orçamento.",
      ),
    );
  }
}

export async function excluirOrcamento(
  id: string,
): Promise<void> {
  try {
    await api.delete(
      `/cotacao-propostas/${id}`,
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Erro ao excluir orçamento.",
      ),
    );
  }
}