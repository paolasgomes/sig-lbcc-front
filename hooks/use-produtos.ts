"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarProdutos,
  mapApiProdutoToProduto,
  desativarProduto as desativarProdutoApi,
} from "@/services/produtos-service";
import { Produto } from "@/types";

export function useProdutos() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const dados = await listarProdutos();
      return dados.map(mapApiProdutoToProduto) as Produto[];
    },
    staleTime: 1000 * 60,
  });

  async function desativarProduto(id: string) {
    await desativarProdutoApi(id);
    await queryClient.invalidateQueries(["produtos"]);
  }

  return {
    produtos: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    desativarProduto,
    query,
  };
}
