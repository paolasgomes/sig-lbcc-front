"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  listarCotacoes,
  obterCotacao,
  criarCotacao,
  atualizarCotacao,
  alterarStatusProgressoCotacao,
  cancelarCotacao,
} from "@/services/cotacoes-service";

import type {
  CotacaoCreateInput,
  CotacaoStatusInput,
  CotacaoUpdateInput,
} from "@/types";

export function useCotacoes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cotacoes"],
    queryFn: () => listarCotacoes(),
    staleTime: 1000 * 60,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["cotacoes"],
    });

  const createMutation = useMutation({
    mutationFn: (dados: CotacaoCreateInput) =>
      criarCotacao(dados),

    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      dados,
    }: {
      id: string;
      dados: CotacaoUpdateInput;
    }) =>
      atualizarCotacao(id, dados),

    onSuccess: (_, { id }) => {
      invalidate();

      queryClient.invalidateQueries({
        queryKey: ["cotacoes", id],
      });
    },
  });

  const progressStatusMutation = useMutation({
    mutationFn: ({
      id,
      dados,
    }: {
      id: string;
      dados: CotacaoStatusInput;
    }) =>
      alterarStatusProgressoCotacao(
        id,
        dados,
      ),

    onSuccess: (_, { id }) => {
      invalidate();

      queryClient.invalidateQueries({
        queryKey: ["cotacoes", id],
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({
      id,
      motivoCancelamento,
    }: {
      id: string;
      motivoCancelamento: string;
    }) =>
      cancelarCotacao(
        id,
        motivoCancelamento,
      ),

    onSuccess: (_, { id }) => {
      invalidate();

      queryClient.invalidateQueries({
        queryKey: ["cotacoes", id],
      });
    },
  });

  return {
    cotacoes: query.data ?? [],

    isLoading: query.isLoading,

    error:
      query.error instanceof Error
        ? query.error.message
        : query.error ?? null,

    refetch: query.refetch,

    criarCotacao:
      createMutation.mutateAsync,

    isCreating:
      createMutation.isPending,

    atualizarCotacao:
      updateMutation.mutateAsync,

    isUpdating:
      updateMutation.isPending,

    alterarStatusProgresso:
      progressStatusMutation.mutateAsync,

    isChangingProgressStatus:
      progressStatusMutation.isPending,

    cancelarCotacao:
      cancelMutation.mutateAsync,

    isCanceling:
      cancelMutation.isPending,

    query,
  };
}

export function useCotacao(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cotacoes", id],
    queryFn: () => obterCotacao(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ["cotacoes"],
    });

    queryClient.invalidateQueries({
      queryKey: ["cotacoes", id],
    });
  };

  const updateMutation = useMutation({
    mutationFn: (dados: CotacaoUpdateInput) =>
      atualizarCotacao(id, dados),

    onSuccess: invalidate,
  });

  const progressStatusMutation = useMutation({
    mutationFn: (dados: CotacaoStatusInput) =>
      alterarStatusProgressoCotacao(
        id,
        dados,
      ),

    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: (motivoCancelamento: string) =>
      cancelarCotacao(
        id,
        motivoCancelamento,
      ),

    onSuccess: invalidate,
  });

  return {
    cotacao: query.data ?? null,

    isLoading: query.isLoading,

    error:
      query.error instanceof Error
        ? query.error.message
        : query.error ?? null,

    refetch: query.refetch,

    atualizarCotacao:
      updateMutation.mutateAsync,

    isUpdating:
      updateMutation.isPending,

    alterarStatusProgresso:
      progressStatusMutation.mutateAsync,

    isChangingProgressStatus:
      progressStatusMutation.isPending,

    cancelarCotacao:
      cancelMutation.mutateAsync,

    isCanceling:
      cancelMutation.isPending,

    query,
  };
}