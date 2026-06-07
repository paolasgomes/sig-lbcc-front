"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarCotacoes,
  obterCotacao,
  criarCotacao,
  atualizarCotacao,
  alternarStatusCotacao,
  excluirCotacao,
  CotacaoVinculosError,
} from "@/services/cotacoes-service";
import type { CotacaoCreateInput, CotacaoUpdateInput } from "@/types";

export { CotacaoVinculosError };

export function useCotacoes(ativo?: boolean | "todas") {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cotacoes", ativo ?? "ativas"],
    queryFn: () => listarCotacoes(ativo ?? "todas"),
    staleTime: 1000 * 60,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["cotacoes"] });

  const createMutation = useMutation({
    mutationFn: (dados: CotacaoCreateInput) => criarCotacao(dados),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: CotacaoUpdateInput }) =>
      atualizarCotacao(id, dados),
    onSuccess: (_, { id }) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["cotacoes", id] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => alternarStatusCotacao(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => excluirCotacao(id),
    onSuccess: invalidate,
  });

  return {
    cotacoes: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    criarCotacao: createMutation.mutateAsync,
    atualizarCotacao: updateMutation.mutateAsync,
    alternarStatus: toggleStatusMutation.mutateAsync,
    excluirCotacao: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
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
    queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
    queryClient.invalidateQueries({ queryKey: ["cotacoes", id] });
  };

  const updateMutation = useMutation({
    mutationFn: (dados: CotacaoUpdateInput) => atualizarCotacao(id, dados),
    onSuccess: invalidate,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () => alternarStatusCotacao(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => excluirCotacao(id),
    onSuccess: invalidate,
  });

  return {
    cotacao: query.data ?? null,
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    atualizarCotacao: updateMutation.mutateAsync,
    alternarStatus: toggleStatusMutation.mutateAsync,
    excluirCotacao: deleteMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
    query,
  };
}
