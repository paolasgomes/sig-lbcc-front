"use client";

import { useQuery } from "@tanstack/react-query";
import { listarHistoricoPaciente } from "@/services/historico-service";

export function useHistorico(pacienteId: string) {
  const query = useQuery({
    queryKey: ["historico", pacienteId],
    queryFn: () => listarHistoricoPaciente(pacienteId),
    enabled: Boolean(pacienteId),
    staleTime: 1000 * 60,
  });

  return {
    historico: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    query,
  };
}
