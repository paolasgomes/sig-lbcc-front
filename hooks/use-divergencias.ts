"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  alterarImpedimento,
  criarDivergencia,
  decidirCancelamento,
  listarDivergencias,
  listarSolicitacoesCancelamento,
  obterDivergencia,
  registrarProvidencia,
  solicitarCancelamento,
  substituirVoucher,
  transicionarDivergencia,
  corrigirOrdem,
  type StatusDivergencia,
} from '@/services/divergencias-service';

export function useDivergencias(filters: Parameters<typeof listarDivergencias>[0] = {}) {
  const query = useQuery({ queryKey: ['divergencias', filters], queryFn: () => listarDivergencias(filters) });
  return { divergencias: query.data ?? [], isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}

export function useDivergencia(id: string) {
  const query = useQuery({ queryKey: ['divergencias', id], queryFn: () => obterDivergencia(id), enabled: Boolean(id) });
  return { divergencia: query.data, isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}

function useDivergenciaMutation<TArgs extends unknown[], TResult>(mutationFn: (...args: TArgs) => Promise<TResult>) {
  const client = useQueryClient();
  const mutation = useMutation<TResult, unknown, TArgs>({
    mutationFn: (args: TArgs) => mutationFn(...args),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['divergencias'] }),
        client.invalidateQueries({ queryKey: ['cancelamentos-ordem'] }),
        client.invalidateQueries({ queryKey: ['ordens-transporte'] }),
        client.invalidateQueries({ queryKey: ['fornecimento'] }),
        client.invalidateQueries({ queryKey: ['utilizacoes-ot'] }),
        client.invalidateQueries({ queryKey: ['comprovacoes-of'] }),
      ]);
    },
  });
  return {
    mutate: (...args: TArgs) => mutation.mutateAsync(args),
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

export const useCriarDivergencia = () => useDivergenciaMutation(criarDivergencia);
export const useTransicionarDivergencia = () => useDivergenciaMutation((id: string, values: { status: StatusDivergencia; justificativa: string; comprovacao?: string }) => transicionarDivergencia(id, values));
export const useRegistrarProvidencia = () => useDivergenciaMutation(registrarProvidencia);
export const useAlterarImpedimento = () => useDivergenciaMutation(alterarImpedimento);
export const useCorrigirOrdem = () => useDivergenciaMutation(corrigirOrdem);
export const useSubstituirVoucher = () => useDivergenciaMutation(substituirVoucher);
export const useSolicitarCancelamento = () => useDivergenciaMutation(solicitarCancelamento);
export const useDecidirCancelamento = () => useDivergenciaMutation(decidirCancelamento);

export function useSolicitacoesCancelamento() {
  const query = useQuery({ queryKey: ['cancelamentos-ordem'], queryFn: listarSolicitacoesCancelamento });
  return { solicitacoes: query.data ?? [], isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}
