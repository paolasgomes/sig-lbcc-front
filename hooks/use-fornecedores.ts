"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarFornecedores,
  obterFornecedor,
  criarFornecedor,
  atualizarFornecedor,
  alternarStatusFornecedor,
  excluirFornecedor,
} from "@/services/fornecedores-service";
import type { FornecedorCreateInput, FornecedorUpdateInput } from "@/types";

export function useFornecedores() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["fornecedores"],
    queryFn: listarFornecedores,
    staleTime: 1000 * 60,
  });

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ["fornecedores"] });

  const createMutation = useMutation({
    mutationFn: (dados: FornecedorCreateInput) => criarFornecedor(dados),
    onSuccess: invalidateList,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: FornecedorUpdateInput }) =>
      atualizarFornecedor(id, dados),
    onSuccess: (_, { id }) => {
      invalidateList();
      queryClient.invalidateQueries({ queryKey: ["fornecedores", id] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => alternarStatusFornecedor(id),
    onSuccess: (_, id) => {
      invalidateList();
      queryClient.invalidateQueries({ queryKey: ["fornecedores", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => excluirFornecedor(id),
    onSuccess: invalidateList,
  });

  return {
    fornecedores: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    criarFornecedor: createMutation.mutateAsync,
    atualizarFornecedor: updateMutation.mutateAsync,
    alternarStatusFornecedor: toggleStatusMutation.mutateAsync,
    excluirFornecedor: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
    query,
  };
}

export function useFornecedor(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["fornecedores", id],
    queryFn: () => obterFornecedor(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
    queryClient.invalidateQueries({ queryKey: ["fornecedores", id] });
  };

  const updateMutation = useMutation({
    mutationFn: (dados: FornecedorUpdateInput) => atualizarFornecedor(id, dados),
    onSuccess: invalidate,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () => alternarStatusFornecedor(id),
    onSuccess: invalidate,
  });

  return {
    fornecedor: query.data ?? null,
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    atualizarFornecedor: updateMutation.mutateAsync,
    alternarStatusFornecedor: toggleStatusMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    query,
  };
}
