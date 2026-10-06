"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  arquivarNotificacao,
  listarNotificacoes,
  marcarNotificacaoComoLida,
} from "@/services/notificacoes-service";

export function useNotificacoes(options: {
  apenasNaoLidas?: boolean;
  incluirArquivadas?: boolean;
} = {}) {
  const query = useQuery({
    queryKey: ["notificacoes", options],
    queryFn: () => listarNotificacoes(options),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

  return {
    notificacoes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ?? null,
    refetch: query.refetch,
    query,
  };
}

export function useMarcarNotificacaoComoLida() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: marcarNotificacaoComoLida,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  return {
    marcarComoLida: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : mutation.error ?? null,
  };
}

export function useArquivarNotificacao() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: arquivarNotificacao,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  return {
    arquivar: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : mutation.error ?? null,
  };
}
