"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listarFornecedores,
  mapApiFornecedorToFornecedor,
} from "@/services/fornecedores-service";
import type { Fornecedor } from "@/types";

export function useFornecedores() {
  const query = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const dados = await listarFornecedores();
      return dados.map(mapApiFornecedorToFornecedor) as Fornecedor[];
    },
    staleTime: 1000 * 60,
  });

  return {
    fornecedores: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    query,
  };
}
