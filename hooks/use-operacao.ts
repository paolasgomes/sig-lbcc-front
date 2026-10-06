"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarExecucoesAutomacao,
  listarPendenciasAdministrativas,
  processarPrazosManualmente,
  AutomacaoJob,
} from "@/services/operacao-service";

export function useOperacaoAutomacao() {
  const queryClient = useQueryClient();
  const execucoesQuery = useQuery({
    queryKey: ["operacao", "automacao", "execucoes"],
    queryFn: listarExecucoesAutomacao,
    refetchInterval: 30_000,
  });
  const pendenciasQuery = useQuery({
    queryKey: ["operacao", "automacao", "pendencias"],
    queryFn: listarPendenciasAdministrativas,
    refetchInterval: 30_000,
  });
  const processamento = useMutation({
    mutationFn: (jobs?: AutomacaoJob[]) => processarPrazosManualmente(jobs),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["operacao", "automacao"] });
      void queryClient.invalidateQueries({ queryKey: ["fornecimento"] });
    },
  });

  return {
    execucoes: execucoesQuery.data ?? [],
    pendencias: pendenciasQuery.data ?? [],
    isLoading: execucoesQuery.isLoading || pendenciasQuery.isLoading,
    error:
      execucoesQuery.error?.message ||
      pendenciasQuery.error?.message ||
      processamento.error?.message ||
      null,
    processar: processamento.mutateAsync,
    isProcessing: processamento.isPending,
    refetch: () => {
      void execucoesQuery.refetch();
      void pendenciasQuery.refetch();
    },
  };
}
