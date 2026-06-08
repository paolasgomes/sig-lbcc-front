import axios from "axios";
import { api } from "./api";
import { getFriendlyApiError } from "@/lib/api-errors";
import type { Cotacao, CotacaoCreateInput, CotacaoUpdateInput, ItemCotacao } from "@/types";

export interface ApiCotacaoDTO {
  id: string;
  descricao: string;
  paciente_id: string;
  area_id: string;
  data_validade: string;
  observacoes?: string | null;
  ativo: boolean;
  numero?: string | null;
  created_at: string;
  pacientes?: { id: string; nome: string } | null;
  areas?: { id: string; nome: string } | null;
}

export interface ApiItemCotacaoDTO {
  id: string;
  cotacao_id: string;
  produto_id?: string | null;
  fornecedor_id?: string | null;
  descricao: string;
  quantidade: number;
  unidade: string;
  ordem?: number | null;
  fornecedores?: {
    id: string;
    razao_social?: string | null;
    nome_fantasia?: string | null;
  } | null;
}

interface ApiErrorBody {
  erro?: string;
  error?: string;
  message?: string;
  cotacaoTemVinculos?: boolean;
  relacionamentos?: { propostas?: number; itens?: number };
}

export class CotacaoVinculosError extends Error {
  relacionamentos: { propostas: number; itens: number };

  constructor(message: string, relacionamentos: { propostas: number; itens: number }) {
    super(message);
    this.name = "CotacaoVinculosError";
    this.relacionamentos = relacionamentos;
  }
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    const candidate = data?.erro ?? data?.error ?? data?.message;

    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }

    if (error.response?.status === 403) {
      return "Apenas gestor pode realizar esta ação.";
    }
  }

  return getFriendlyApiError(error, fallback);
}

export function mapApiCotacaoToCotacao(
  apiCotacao: ApiCotacaoDTO,
  itens: ItemCotacao[] = [],
): Cotacao {
  return {
    id: apiCotacao.id,
    descricao: apiCotacao.descricao ?? "",
    pacienteId: apiCotacao.paciente_id ?? "",
    areaId: apiCotacao.area_id ?? "",
    dataValidade: apiCotacao.data_validade ?? "",
    observacoes: apiCotacao.observacoes ?? "",
    ativo: apiCotacao.ativo ?? true,
    numero: apiCotacao.numero ?? undefined,
    criadoEm: apiCotacao.created_at ?? new Date().toISOString(),
    pacienteNome: apiCotacao.pacientes?.nome,
    areaNome: apiCotacao.areas?.nome,
    itens,
  };
}

function mapFornecedorNome(
  fornecedor?: ApiItemCotacaoDTO["fornecedores"],
): string | undefined {
  if (!fornecedor) return undefined;
  return fornecedor.nome_fantasia ?? fornecedor.razao_social ?? undefined;
}

export function mapApiItemToItemCotacao(dto: ApiItemCotacaoDTO): ItemCotacao {
  return {
    id: dto.id,
    produtoId: dto.produto_id ?? undefined,
    fornecedorId: dto.fornecedor_id ?? undefined,
    fornecedorNome: mapFornecedorNome(dto.fornecedores),
    descricao: dto.descricao ?? "",
    quantidade: dto.quantidade ?? 0,
    unidade: dto.unidade ?? "UN",
    ordem: dto.ordem ?? undefined,
  };
}

function mapCotacaoToApiPayload(dados: Partial<CotacaoCreateInput>) {
  return {
    descricao: dados.descricao,
    data_validade: dados.dataValidade,
    paciente_id: dados.pacienteId,
    area_id: dados.areaId,
    observacoes: dados.observacoes ?? "",
  };
}

function mapItemToApiPayload(
  item: Omit<ItemCotacao, "id"> & { produtoId: string; fornecedorId: string },
  ordem: number,
) {
  return {
    produto_id: item.produtoId,
    fornecedor_id: item.fornecedorId,
    descricao: item.descricao,
    quantidade: item.quantidade,
    unidade: item.unidade,
    ordem,
  };
}

export async function listarItensCotacao(cotacaoId: string): Promise<ItemCotacao[]> {
  try {
    const response = await api.get<ApiItemCotacaoDTO[]>(
      `/cotacao-itens/cotacao/${cotacaoId}`,
    );
    return response.data.map(mapApiItemToItemCotacao);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar itens da cotação."));
  }
}

export async function listarCotacoes(ativo?: boolean | "todas"): Promise<Cotacao[]> {
  try {
    let dtos: ApiCotacaoDTO[];

    if (ativo === "todas") {
      const [ativas, inativas] = await Promise.all([
        api.get<ApiCotacaoDTO[]>("/cotacoes"),
        api.get<ApiCotacaoDTO[]>("/cotacoes", { params: { ativo: false } }),
      ]);
      const merged = new Map<string, ApiCotacaoDTO>();
      [...ativas.data, ...inativas.data].forEach((c) => merged.set(c.id, c));
      dtos = Array.from(merged.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else if (ativo === false) {
      const response = await api.get<ApiCotacaoDTO[]>("/cotacoes", {
        params: { ativo: false },
      });
      dtos = response.data;
    } else {
      const response = await api.get<ApiCotacaoDTO[]>("/cotacoes");
      dtos = response.data;
    }

    const cotacoesComItens = await Promise.all(
      dtos.map(async (dto) => {
        const itens = await listarItensCotacao(dto.id);
        return mapApiCotacaoToCotacao(dto, itens);
      }),
    );

    return cotacoesComItens;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar cotações."));
  }
}

export async function obterCotacao(id: string): Promise<Cotacao> {
  try {
    const [cotacaoResponse, itens] = await Promise.all([
      api.get<ApiCotacaoDTO>(`/cotacoes/${id}`),
      listarItensCotacao(id),
    ]);
    return mapApiCotacaoToCotacao(cotacaoResponse.data, itens);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar cotação."));
  }
}

export async function criarCotacao(dados: CotacaoCreateInput): Promise<Cotacao> {
  try {
    const response = await api.post<ApiCotacaoDTO>(
      "/cotacoes",
      mapCotacaoToApiPayload(dados),
    );
    const cotacaoId = response.data.id;

    const itensCriados: ItemCotacao[] = [];
    for (let index = 0; index < dados.itens.length; index++) {
      const itemResponse = await api.post<ApiItemCotacaoDTO>(
        `/cotacao-itens/cotacao/${cotacaoId}`,
        mapItemToApiPayload(dados.itens[index], index + 1),
      );
      itensCriados.push(mapApiItemToItemCotacao(itemResponse.data));
    }

    return mapApiCotacaoToCotacao(response.data, itensCriados);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao criar cotação."));
  }
}

export async function atualizarCotacao(id: string, dados: CotacaoUpdateInput): Promise<Cotacao> {
  try {
    const response = await api.put<ApiCotacaoDTO>(
      `/cotacoes/${id}`,
      mapCotacaoToApiPayload(dados),
    );

    if (dados.itens) {
      const itensAtuais = await listarItensCotacao(id);
      const idsAtuais = new Set(itensAtuais.map((i) => i.id).filter(Boolean) as string[]);
      const idsEnviados = new Set(
        dados.itens.map((i) => i.id).filter(Boolean) as string[],
      );

      for (const itemAtual of itensAtuais) {
        if (itemAtual.id && !idsEnviados.has(itemAtual.id)) {
          await api.delete(`/cotacao-itens/${itemAtual.id}`);
        }
      }

      for (let index = 0; index < dados.itens.length; index++) {
        const item = dados.itens[index];
        const payload = mapItemToApiPayload(item, index + 1);

        if (item.id && idsAtuais.has(item.id)) {
          await api.put(`/cotacao-itens/${item.id}`, payload);
        } else {
          await api.post(`/cotacao-itens/cotacao/${id}`, payload);
        }
      }
    }

    return obterCotacao(id);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao atualizar cotação."));
  }
}

export async function alternarStatusCotacao(id: string): Promise<Cotacao> {
  try {
    await api.patch(`/cotacoes/${id}/status`);
    return obterCotacao(id);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao alterar status da cotação."));
  }
}

export async function excluirCotacao(id: string): Promise<void> {
  try {
    await api.delete(`/cotacoes/${id}`);
  } catch (error) {
    if (axios.isAxiosError<ApiErrorBody>(error)) {
      const data = error.response?.data;

      if (data?.cotacaoTemVinculos && data.relacionamentos) {
        throw new CotacaoVinculosError(
          data.erro ?? "Cotação possui vínculos e não pode ser excluída.",
          {
            propostas: data.relacionamentos.propostas ?? 0,
            itens: data.relacionamentos.itens ?? 0,
          },
        );
      }

      if (error.response?.status === 403) {
        throw new Error("Apenas gestor pode realizar esta ação.");
      }
    }

    throw new Error(getApiErrorMessage(error, "Erro ao excluir cotação."));
  }
}
