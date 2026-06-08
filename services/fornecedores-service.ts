import { api } from "./api";
import type { Fornecedor } from "@/types";
import { getFriendlyApiError } from "@/lib/api-errors";

export interface ApiFornecedorDTO {
  id: string;
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
}

function getErrorMessage(error: unknown, fallback: string) {
  return getFriendlyApiError(error, fallback);
}

export function mapApiFornecedorToFornecedor(dto: ApiFornecedorDTO): Fornecedor {
  const nome = dto.nome_fantasia ?? dto.razao_social ?? "Fornecedor";

  return {
    id: dto.id,
    nome,
    razaoSocial: dto.razao_social,
    nomeFantasia: dto.nome_fantasia,
    cnpj: dto.cnpj,
    email: dto.email ?? "",
    telefone: dto.telefone ?? "",
    contato: "",
    tipoServico: "",
    ativo: dto.ativo ?? true,
  };
}

export async function listarFornecedores() {
  try {
    const response = await api.get<ApiFornecedorDTO[]>("/fornecedores");
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar fornecedores."));
  }
}
