"use client";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

import {
    solicitarCancelamento,
    decidirCancelamento,
    type SolicitarCancelamentoPayload,
    type DecidirCancelamentoPayload,
    listarCancelamentosDiretos,
    type SolicitacaoCancelamentoDireto,
    } from "@/services/cancelamento-service";

export function useSolicitarCancelamento() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (dados: SolicitarCancelamentoPayload) =>
        solicitarCancelamento(dados),

        onSuccess: () => {
        queryClient.invalidateQueries({
            queryKey: ["fornecimento"],
        });

        queryClient.invalidateQueries({
            queryKey: ["transporte"],
        });

        queryClient.invalidateQueries({
            queryKey: ["cancelamentos"],
        });
        },
    });

    return {
        solicitar: mutation.mutateAsync,
        isSoliciting: mutation.isPending,
        error:
        mutation.error instanceof Error
            ? mutation.error.message
            : mutation.error ?? null,
    };
    }

export function useDecidirCancelamento() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({
        solicitacaoId,
        dados,
        }: {
        solicitacaoId: string;
        dados: DecidirCancelamentoPayload;
        }) => decidirCancelamento(solicitacaoId, dados),

        onSuccess: () => {
        queryClient.invalidateQueries({
            queryKey: ["cancelamentos"],
        });

        queryClient.invalidateQueries({
            queryKey: ["fornecimento"],
        });

        queryClient.invalidateQueries({
            queryKey: ["transporte"],
        });
        },
    });

    return {
        decidir: mutation.mutateAsync,
        isDeciding: mutation.isPending,
        error:
        mutation.error instanceof Error
            ? mutation.error.message
            : mutation.error ?? null,
    };
    }

export function useListarCancelamentosDiretos() {
    const query = useQuery({
        queryKey: ["cancelamentos"],
        queryFn: listarCancelamentosDiretos,
    });

    return {
        solicitacoes: (query.data ?? []) as SolicitacaoCancelamentoDireto[],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}