import axios from "axios";
import { api } from "./api";
import { getFriendlyApiError } from "@/lib/api-errors";

import type {
  Cotacao,
  CotacaoCreateInput,
  CotacaoStatusInput,
  CotacaoUpdateInput,
  ItemCotacao,
} from "@/types";

export interface ApiCotacaoDTO {
  id: string;
  descricao: string;
  paciente_id: string;
  area_id: string;
  data_validade: string;
  observacoes?: string | null;
  status: string;
  motivo_cancelamento?: string | null;
  numero?: string | null;
  created_at: string;
  updated_at?: string;

  pacientes?: {
    id: string;
    nome: string;
  } | null;

  areas?: {
    id: string;
    nome: string;
  } | null;

  cotacao_itens?: ApiItemCotacaoDTO[];
}

export interface ApiItemCotacaoDTO {
  id: string;
  cotacao_id: string;
  produto_id?: string | null;
  descricao: string;
  quantidade: number;
  unidade: string;
  especificacoes?: string | null;
  ordem?: number | null;
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

    const message =
      data?.erro ??
      data?.error ??
      data?.message;

    if (message) {
      return message;
    }

    if (error.response?.status === 403) {
      return "Apenas gestor pode realizar esta ação.";
    }
  }

  return getFriendlyApiError(
    error,
    fallback,
  );
}

// =========================
// MAPEADORES
// =========================

export function mapApiItemToItemCotacao(
  dto: ApiItemCotacaoDTO,
): ItemCotacao {
  return {
    id: dto.id,
    cotacaoId: dto.cotacao_id,
    produtoId:
      dto.produto_id ?? undefined,
    descricao: dto.descricao ?? "",
    quantidade: dto.quantidade ?? 0,
    unidade: dto.unidade ?? "UN",
    especificacoes:
      dto.especificacoes ?? undefined,
    ordem: dto.ordem ?? undefined,
  };
}

export function mapApiCotacaoToCotacao(
  dto: ApiCotacaoDTO,
  itens: ItemCotacao[] = [],
): Cotacao {
  return {
    id: dto.id,

    numero:
      dto.numero ?? undefined,

    descricao:
      dto.descricao ?? "",

    pacienteId:
      dto.paciente_id ?? "",

    areaId:
      dto.area_id ?? "",

    dataValidade:
      dto.data_validade ?? "",

    observacoes:
      dto.observacoes ?? "",

    status:
      dto.status as Cotacao["status"],

    motivoCancelamento:
      dto.motivo_cancelamento ?? null,

    criadoEm:
      dto.created_at ??
      new Date().toISOString(),

    atualizadoEm:
      dto.updated_at ?? undefined,

    pacienteNome:
      dto.pacientes?.nome,

    areaNome:
      dto.areas?.nome,

    itens:
      dto.cotacao_itens?.map(
        mapApiItemToItemCotacao,
      ) ?? itens,
  };
}

function mapCotacaoToApiPayload(
  dados:
    | Partial<CotacaoCreateInput>
    | CotacaoUpdateInput,
) {
  return {
    ...(dados.descricao !== undefined && {
      descricao: dados.descricao,
    }),

    ...(dados.dataValidade !== undefined && {
      data_validade: dados.dataValidade,
    }),

    ...(dados.pacienteId !== undefined && {
      paciente_id: dados.pacienteId,
    }),

    ...(dados.areaId !== undefined && {
      area_id: dados.areaId,
    }),

    ...(dados.observacoes !== undefined && {
      observacoes:
        dados.observacoes ?? "",
    }),
  };
}

function mapItemToApiPayload(
  item: Omit<ItemCotacao, "id"> & {
    id?: string;
  },
  ordem: number,
) {
  return {
    ...(item.id && {
      id: item.id,
    }),

    produto_id:
      item.produtoId ?? null,

    descricao:
      item.descricao,

    quantidade:
      item.quantidade,

    unidade:
      item.unidade,

    especificacoes:
      item.especificacoes ?? null,

    ordem,
  };
}

// =========================
// ITENS
// =========================

export async function listarItensCotacao(
  cotacaoId: string,
): Promise<ItemCotacao[]> {
  try {
    const response =
      await api.get<ApiItemCotacaoDTO[]>(
        `/cotacao-itens/cotacao/${cotacaoId}`,
      );

    return response.data.map(
      mapApiItemToItemCotacao,
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Erro ao carregar itens da cotação.",
      ),
    );
  }
}

// =========================
// LISTAR COTAÇÕES
// =========================

export async function listarCotacoes(): Promise<Cotacao[]> {
  try {
    const response =
      await api.get<ApiCotacaoDTO[]>(
        "/cotacoes",
      );

    const dtos = response.data;

    return Promise.all(
      dtos.map(async (dto) => {
        if (dto.cotacao_itens) {
          return mapApiCotacaoToCotacao(
            dto,
          );
        }

        const itens =
          await listarItensCotacao(
            dto.id,
          );

        return mapApiCotacaoToCotacao(
          dto,
          itens,
        );
      }),
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Erro ao carregar cotações.",
      ),
    );
  }
}

// =========================
// OBTER COTAÇÃO
// =========================

export async function obterCotacao(
  id: string,
): Promise<Cotacao> {
  try {
    const response =
      await api.get<ApiCotacaoDTO>(
        `/cotacoes/${id}`,
      );

    const dto = response.data;

    if (dto.cotacao_itens) {
      return mapApiCotacaoToCotacao(
        dto,
      );
    }

    const itens =
      await listarItensCotacao(id);

    return mapApiCotacaoToCotacao(
      dto,
      itens,
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Erro ao carregar cotação.",
      ),
    );
  }
}

// =========================
// CRIAR COTAÇÃO
// =========================

export async function criarCotacao(
  dados: CotacaoCreateInput,
): Promise<Cotacao> {
  try {
    const payload = {
      ...mapCotacaoToApiPayload(
        dados,
      ),

      itens: dados.itens.map(
        (item, index) =>
          mapItemToApiPayload(
            item,
            index + 1,
          ),
      ),
    };

    const response =
      await api.post<ApiCotacaoDTO>(
        "/cotacoes",
        payload,
      );

    return mapApiCotacaoToCotacao(
      response.data,
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Erro ao criar cotação.",
      ),
    );
  }
}

// =========================
// ATUALIZAR COTAÇÃO
// =========================

export async function atualizarCotacao(
  id: string,
  dados: CotacaoUpdateInput,
): Promise<Cotacao> {
  try {
    await api.put(
      `/cotacoes/${id}`,
      mapCotacaoToApiPayload(
        dados,
      ),
    );

    if (dados.itens) {
      const itensAtuais =
        await listarItensCotacao(
          id,
        );

      const idsEnviados =
        new Set(
          dados.itens
            .map(
              (item) => item.id,
            )
            .filter(Boolean),
        );

      // Remove os itens que
      // não foram enviados novamente.
      for (const item of itensAtuais) {
        if (
          item.id &&
          !idsEnviados.has(
            item.id,
          )
        ) {
          await api.delete(
            `/cotacao-itens/${item.id}`,
          );
        }
      }

      const idsAtuais =
        new Set(
          itensAtuais
            .map(
              (item) => item.id,
            )
            .filter(Boolean),
        );

      // Atualiza itens existentes
      // ou cria novos itens.
      for (
        let index = 0;
        index < dados.itens.length;
        index++
      ) {
        const item =
          dados.itens[index];

        const payload =
          mapItemToApiPayload(
            item,
            index + 1,
          );

        if (
          item.id &&
          idsAtuais.has(
            item.id,
          )
        ) {
          await api.put(
            `/cotacao-itens/${item.id}`,
            payload,
          );
        } else {
          await api.post(
            `/cotacao-itens/cotacao/${id}`,
            payload,
          );
        }
      }
    }

    return obterCotacao(id);
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Erro ao atualizar cotação.",
      ),
    );
  }
}

// =========================
// STATUS DO PROCESSO
// =========================

export async function alterarStatusProgressoCotacao(
  id: string,
  dados: CotacaoStatusInput,
): Promise<Cotacao> {
  try {
    const response =
      await api.patch<ApiCotacaoDTO>(
        `/cotacoes/${id}/status-progresso`,
        {
          status:
            dados.status,

          ...(dados.motivo_cancelamento !==
            undefined && {
            motivo_cancelamento:
              dados.motivo_cancelamento,
          }),
        },
      );

    return mapApiCotacaoToCotacao(
      response.data,
    );
  } catch (error) {
    throw new Error(
      getApiErrorMessage(
        error,
        "Erro ao alterar status da cotação.",
      ),
    );
  }
}

// =========================
// CANCELAR COTAÇÃO
// =========================

export async function cancelarCotacao(
  id: string,
  motivoCancelamento: string,
): Promise<Cotacao> {
  const motivo =
    motivoCancelamento.trim();

  if (!motivo) {
    throw new Error(
      "Informe o motivo do cancelamento.",
    );
  }

  return alterarStatusProgressoCotacao(
    id,
    {
      status:
        "cancelada" as Cotacao["status"],

      motivo_cancelamento:
        motivo,
    },
  );
}

