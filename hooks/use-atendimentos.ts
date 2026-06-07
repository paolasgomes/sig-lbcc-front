"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarAtendimentos,
  obterAtendimento,
  criarAtendimento,
  atualizarAtendimento,
  excluirAtendimento,
} from "@/services/atendimentos-service";
import type { AtendimentoCreateInput, AtendimentoUpdateInput } from "@/types";

function invalidateAtendimentosAndHistorico(
  queryClient: ReturnType<typeof useQueryClient>,
  pacienteId?: string,
) {
  queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
  if (pacienteId) {
    queryClient.invalidateQueries({ queryKey: ["historico", pacienteId] });
  }
}

export function useAtendimentos() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["atendimentos"],
    queryFn: listarAtendimentos,
    staleTime: 1000 * 60,
  });

  const createMutation = useMutation({
    mutationFn: (dados: AtendimentoCreateInput) => criarAtendimento(dados),
    onSuccess: (_, dados) => {
      invalidateAtendimentosAndHistorico(queryClient, dados.pacienteId);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: AtendimentoUpdateInput }) =>
      atualizarAtendimento(id, dados),
    onSuccess: (atendimento) => {
      invalidateAtendimentosAndHistorico(queryClient, atendimento.pacienteId);
      queryClient.invalidateQueries({ queryKey: ["atendimentos", atendimento.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string; pacienteId: string }) =>
      excluirAtendimento(id),
    onSuccess: (_, { pacienteId }) => {
      invalidateAtendimentosAndHistorico(queryClient, pacienteId);
    },
  });

  return {
    atendimentos: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    criarAtendimento: createMutation.mutateAsync,
    atualizarAtendimento: updateMutation.mutateAsync,
    excluirAtendimento: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    query,
  };
}

export function useAtendimento(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["atendimentos", id],
    queryFn: () => obterAtendimento(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });

  const invalidate = (pacienteId?: string) => {
    invalidateAtendimentosAndHistorico(queryClient, pacienteId);
    queryClient.invalidateQueries({ queryKey: ["atendimentos", id] });
  };

  const updateMutation = useMutation({
    mutationFn: (dados: AtendimentoUpdateInput) => atualizarAtendimento(id, dados),
    onSuccess: (atendimento) => invalidate(atendimento.pacienteId),
  });

  const deleteMutation = useMutation({
    mutationFn: (pacienteId: string) => excluirAtendimento(id),
    onSuccess: (_, pacienteId) => invalidate(pacienteId),
  });

  return {
    atendimento: query.data ?? null,
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    atualizarAtendimento: updateMutation.mutateAsync,
    excluirAtendimento: deleteMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    query,
  };
}
