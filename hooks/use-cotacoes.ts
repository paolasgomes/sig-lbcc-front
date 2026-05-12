"use client";

import { useQuery } from "@tanstack/react-query";
import { cotacoesMock } from "@/mocks";
import { Cotacao } from "@/types";

export function useCotacoes() {
  const query = useQuery({
    queryKey: ["cotacoes"],
    queryFn: async () => {
      // Atualmente as cotações vêm de mocks; futuramente trocar para service/API
      return cotacoesMock as Cotacao[];
    },
    staleTime: 1000 * 60,
  });

  return {
    cotacoes: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    query,
  };
}
