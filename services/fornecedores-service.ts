import { api } from "./api";
import { getFriendlyApiError } from "@/lib/api-errors";
import type {
  ApiFornecedorDTO,
  Fornecedor,
  FornecedorCreateInput,
  FornecedorUpdateInput,
} from "@/types";

function getErrorMessage(error: unknown, fallback: string) {
  return getFriendlyApiError(error, fallback);
}

export function mapApiFornecedorToFornecedor(dto: ApiFornecedorDTO): Fornecedor {
  return {
    id: dto.id,
    razaoSocial: dto.razao_social ?? "",
    nomeFantasia: dto.nome_fantasia ?? undefined,
    cnpj: dto.cnpj ?? undefined,
    telefone: dto.telefone ?? undefined,
    email: dto.email ?? undefined,
    ativo: dto.ativo ?? true,
    fornecedorTemVinculos: dto.fornecedorTemVinculos,
  };
}

export function mapFornecedorCreateToApi(dados: FornecedorCreateInput) {
  return {
    razao_social: dados.razaoSocial,
    nome_fantasia: dados.nomeFantasia,
    cnpj: dados.cnpj,
    telefone: dados.telefone,
    email: dados.email,
    ativo: dados.ativo,
  };
}

export function mapFornecedorUpdateToApi(dados: FornecedorUpdateInput) {
  return {
    nome_fantasia: dados.nomeFantasia,
    telefone: dados.telefone,
    email: dados.email,
  };
}

function unwrapFornecedor(data: ApiFornecedorDTO | ApiFornecedorDTO[]) {
  return Array.isArray(data) ? data[0] : data;
}

export async function listarFornecedores(): Promise<Fornecedor[]> {
  try {
    const response = await api.get<ApiFornecedorDTO[]>("/fornecedores");
    return response.data.map(mapApiFornecedorToFornecedor);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar fornecedores."));
  }
}

export async function obterFornecedor(id: string): Promise<Fornecedor> {
  try {
    const response = await api.get<ApiFornecedorDTO>(`/fornecedores/${id}`);
    return mapApiFornecedorToFornecedor(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar fornecedor."));
  }
}

export async function criarFornecedor(dados: FornecedorCreateInput): Promise<Fornecedor> {
  try {
    const response = await api.post<ApiFornecedorDTO | ApiFornecedorDTO[]>(
      "/fornecedores",
      mapFornecedorCreateToApi(dados),
    );
    return mapApiFornecedorToFornecedor(unwrapFornecedor(response.data));
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao criar fornecedor."));
  }
}

export async function atualizarFornecedor(
  id: string,
  dados: FornecedorUpdateInput,
): Promise<Fornecedor> {
  try {
    const response = await api.put<ApiFornecedorDTO | ApiFornecedorDTO[]>(
      `/fornecedores/${id}`,
      mapFornecedorUpdateToApi(dados),
    );
    return mapApiFornecedorToFornecedor(unwrapFornecedor(response.data));
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao atualizar fornecedor."));
  }
}

export async function alternarStatusFornecedor(id: string): Promise<Fornecedor> {
  try {
    const response = await api.patch<{ data: ApiFornecedorDTO }>(
      `/fornecedores/${id}/status`,
    );
    return mapApiFornecedorToFornecedor(response.data.data);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao alterar status do fornecedor."));
  }
}

export async function excluirFornecedor(id: string): Promise<void> {
  try {
    await api.delete(`/fornecedores/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao excluir fornecedor."));
  }
}
