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
    confirmarRecebimentoOrdemDeFornecimento,
    reenviarEmailOrdemDeFornecimento,
    finalizarOrdemDeFornecimento,
    atualizarPrazoOrdemDeFornecimento,
    listarGestoresResponsaveis,
} from "@/services/fornecimento-service";
import {
    obterLembreteFornecedor,
    reenviarLembreteFornecedor,
} from "@/services/lembretes-fornecedor-service";

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

export function useConfirmarRecebimentoOrdemDeFornecimento() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (id: string) =>
            confirmarRecebimentoOrdemDeFornecimento(id),

        onSuccess: (ordem) => {
            queryClient.invalidateQueries({
                queryKey: ["fornecimento"],
            });

            queryClient.invalidateQueries({
                queryKey: ["fornecimento", ordem.id],
            });
        },
    });

    return {
        confirmarRecebimento: mutation.mutateAsync,
        isConfirming: mutation.isPending,
        error:
            mutation.error instanceof Error
                ? mutation.error.message
                : mutation.error ?? null,
    };
}

export function useFinalizarOrdemDeFornecimento() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (id: string) => finalizarOrdemDeFornecimento(id),
        onSuccess: (ordem) => {
            queryClient.invalidateQueries({ queryKey: ["fornecimento"] });
            queryClient.setQueryData(["fornecimento", ordem.id], ordem);
        },
    });

    return {
        finalizar: mutation.mutateAsync,
        isFinalizing: mutation.isPending,
        error:
            mutation.error instanceof Error
                ? mutation.error.message
                : mutation.error ?? null,
    };
}

export function useReenviarEmailOrdemDeFornecimento() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (id: string) => reenviarEmailOrdemDeFornecimento(id),
        onSuccess: (_envio, id) => {
            queryClient.invalidateQueries({ queryKey: ["fornecimento"] });
            queryClient.invalidateQueries({ queryKey: ["fornecimento", id] });
        },
    });

    return {
        reenviarEmail: mutation.mutateAsync,
        isReenviandoEmail: mutation.isPending,
        error:
            mutation.error instanceof Error
                ? mutation.error.message
                : mutation.error ?? null,
    };
}

export function useAtualizarPrazoOrdemDeFornecimento() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({
            id,
            data_previsao_entrega,
            responsavel_ids,
        }: {
            id: string;
            data_previsao_entrega: string | null;
            responsavel_ids: string[];
        }) => atualizarPrazoOrdemDeFornecimento(id, {
            data_previsao_entrega,
            responsavel_ids,
        }),
        onSuccess: (ordem) => {
            queryClient.invalidateQueries({ queryKey: ["fornecimento"] });
            queryClient.setQueryData(["fornecimento", ordem.id], ordem);
        },
    });

    return {
        atualizarPrazo: mutation.mutateAsync,
        isUpdating: mutation.isPending,
        error: mutation.error instanceof Error ? mutation.error.message : mutation.error ?? null,
    };
}

export function useLembreteFornecedor(id: string) {
    const query = useQuery({
        queryKey: ["lembrete-fornecedor", id],
        queryFn: () => obterLembreteFornecedor(id),
        enabled: Boolean(id),
        staleTime: 1000 * 30,
        refetchInterval: 1000 * 60,
    });

    return {
        lembrete: query.data ?? null,
        isLoading: query.isLoading,
        error: query.error instanceof Error ? query.error.message : query.error ?? null,
        refetch: query.refetch,
    };
}

export function useReenviarLembreteFornecedor() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: reenviarLembreteFornecedor,
        onSuccess: (lembrete) => {
            queryClient.setQueryData(
                ["lembrete-fornecedor", lembrete.ordemFornecimentoId],
                lembrete,
            );
        },
    });

    return {
        reenviar: mutation.mutateAsync,
        isUpdating: mutation.isPending,
        error: mutation.error instanceof Error ? mutation.error.message : mutation.error ?? null,
    };
}

export function useGestoresResponsaveis() {
    const query = useQuery({
        queryKey: ["gestores-responsaveis"],
        queryFn: listarGestoresResponsaveis,
        staleTime: 1000 * 60 * 5,
    });

    return {
        gestores: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error instanceof Error ? query.error.message : query.error ?? null,
    };
}
