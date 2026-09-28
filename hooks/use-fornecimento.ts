"use client";

import {
useMutation,
useQuery,
useQueryClient,
} from "@tanstack/react-query";

import {
listarOrdensDeFornecimento,
obterOrdemDeFornecimento,
gerarOrdensDeFornecimento,
} from "@/services/fornecimento-service";

export function useOrdensDeFornecimento() {
const query = useQuery({
    queryKey: ["fornecimento"],
    queryFn: () => listarOrdensDeFornecimento(),
    staleTime: 1000 * 60,
});

return {
    ordens: query.data ?? [],
    isLoading: query.isLoading,
    error:
    query.error instanceof Error
        ? query.error.message
        : query.error ?? null,
    refetch: query.refetch,
    query,
};
}

export function useOrdemDeFornecimento(id: string) {
const query = useQuery({
    queryKey: ["fornecimento", id],
    queryFn: () => obterOrdemDeFornecimento(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
});

return {
    ordem: query.data ?? null,
    isLoading: query.isLoading,
    error:
    query.error instanceof Error
        ? query.error.message
        : query.error ?? null,
    refetch: query.refetch,
    query,
};
}

export function useGerarOrdensDeFornecimento() {
const queryClient = useQueryClient();

const mutation = useMutation({
    mutationFn: (cotacaoId: string) =>
    gerarOrdensDeFornecimento(cotacaoId),

    onSuccess: () => {
    queryClient.invalidateQueries({
        queryKey: ["fornecimento"],
    });

    queryClient.invalidateQueries({
        queryKey: ["cotacoes"],
    });
    },
});

return {
    gerarOrdens: mutation.mutateAsync,
    isGenerating: mutation.isPending,
    error:
    mutation.error instanceof Error
        ? mutation.error.message
        : mutation.error ?? null,
};
}