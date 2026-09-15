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
  criarOrcamentosItem,
  atualizarOrcamentoItem,
  excluirOrcamentoItem,
  escolherVencedorItem,
} from "@/services/cotacoes-service";

import type {
  Cotacao,
  CotacaoCreateInput,
  CotacaoStatusInput,
  CotacaoUpdateInput,
  OrcamentoBlocoInput,
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

  const onOrcamentoSuccess = (cotacao: Cotacao) => {
    queryClient.setQueryData(
      ["cotacoes", id],
      cotacao,
    );

    invalidate();
  };

  const createOrcamentosMutation = useMutation({
    mutationFn: ({
      itemId,
      blocos,
    }: {
      itemId: string;
      blocos: OrcamentoBlocoInput[];
    }) =>
      criarOrcamentosItem(
        id,
        itemId,
        blocos,
      ),

    onSuccess: onOrcamentoSuccess,
  });

  const updateOrcamentoMutation = useMutation({
    mutationFn: ({
      itemId,
      orcamentoId,
      valorUnitario,
    }: {
      itemId: string;
      orcamentoId: string;
      valorUnitario: number;
    }) =>
      atualizarOrcamentoItem(
        id,
        itemId,
        orcamentoId,
        valorUnitario,
      ),

    onSuccess: onOrcamentoSuccess,
  });

  const deleteOrcamentoMutation = useMutation({
    mutationFn: ({
      itemId,
      orcamentoId,
    }: {
      itemId: string;
      orcamentoId: string;
    }) =>
      excluirOrcamentoItem(
        id,
        itemId,
        orcamentoId,
      ),

    onSuccess: onOrcamentoSuccess,
  });

  const escolherVencedorMutation = useMutation({
    mutationFn: ({
      itemId,
      orcamentoId,
    }: {
      itemId: string;
      orcamentoId: string;
    }) =>
      escolherVencedorItem(
        id,
        itemId,
        orcamentoId,
      ),

    onSuccess: onOrcamentoSuccess,
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

    criarOrcamentos:
      createOrcamentosMutation.mutateAsync,

    isCreatingOrcamentos:
      createOrcamentosMutation.isPending,

    atualizarOrcamento:
      updateOrcamentoMutation.mutateAsync,

    isUpdatingOrcamento:
      updateOrcamentoMutation.isPending,

    apagarOrcamento:
      deleteOrcamentoMutation.mutateAsync,

    isDeletingOrcamento:
      deleteOrcamentoMutation.isPending,

    escolherVencedor:
      escolherVencedorMutation.mutateAsync,

    isEscolhendoVencedor:
      escolherVencedorMutation.isPending,

    query,
  };
}