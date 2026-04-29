import axios from "axios";
import { api } from "./api";
import type { Produto } from "@/types";

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export interface ApiProdutoDTO {
  id: string;
  nome: string;
  descricao: string;
  unidade: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProdutoCreateInput {
  nome: string;
  descricao: string;
  unidade: string;
  ativo?: boolean;
}

export type ProdutoUpdateInput = Partial<ProdutoCreateInput>;

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error || error.response?.data?.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function mapApiProdutoToProduto(apiProduto: ApiProdutoDTO): Produto {
  return {
    id: apiProduto.id ?? "",
    nome: apiProduto.nome ?? "",
    descricao: apiProduto.descricao ?? "",
    unidade: apiProduto.unidade ?? "UN",
    ativo: apiProduto.ativo ?? true,
    criadoEm: apiProduto.created_at ?? new Date().toISOString(),
    atualizadoEm: apiProduto.updated_at ?? new Date().toISOString(),
  };
}

export function mapProdutoToApiPayload(produto: Partial<Produto>): ProdutoCreateInput {
  return {
    nome: produto.nome ?? "",
    descricao: produto.descricao ?? "",
    unidade: produto.unidade ?? "UN",
    ativo: produto.ativo ?? true,
  };
}

export async function listarProdutos() {
  try {
    const response = await api.get<ApiProdutoDTO[]>("/produtos");
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar produtos."));
  }
}

export async function obterProduto(id: string) {
  try {
    const response = await api.get<ApiProdutoDTO>(`/produtos/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar produto."));
  }
}

export async function criarProduto(dados: ProdutoCreateInput) {
  try {
    const response = await api.post<ApiProdutoDTO>("/produtos", dados);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao criar produto."));
  }
}

export async function atualizarProduto(id: string, dados: ProdutoUpdateInput) {
  try {
    const response = await api.put<ApiProdutoDTO>(`/produtos/${id}`, dados);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao atualizar produto."));
  }
}

export async function desativarProduto(id: string) {
  try {
    const response = await api.put<ApiProdutoDTO>(`/produtos/${id}`, { ativo: false });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao desativar produto."));
  }
}
//
