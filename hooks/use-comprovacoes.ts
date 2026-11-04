"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  finalizarOrdemTransporte,
  listarComprovacoesOF,
  listarUtilizacoesOT,
  registrarComprovacaoOF,
  registrarUtilizacaoOT,
} from '@/services/comprovacoes-service';

export function useComprovacoesOF(ordemId: string) {
  const query = useQuery({
    queryKey: ['comprovacoes-of', ordemId],
    queryFn: () => listarComprovacoesOF(ordemId),
    enabled: Boolean(ordemId),
  });
  return { historico: query.data, isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}

export function useRegistrarComprovacaoOF(ordemId: string) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: Parameters<typeof registrarComprovacaoOF>[1]) => registrarComprovacaoOF(ordemId, values),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['comprovacoes-of', ordemId] }),
        client.invalidateQueries({ queryKey: ['fornecimento', ordemId] }),
        client.invalidateQueries({ queryKey: ['fornecimento'] }),
      ]);
    },
  });
  return { registrar: mutation.mutateAsync, isSubmitting: mutation.isPending, error: mutation.error };
}

export function useUtilizacoesOT(ordemId: string) {
  const query = useQuery({
    queryKey: ['utilizacoes-ot', ordemId],
    queryFn: () => listarUtilizacoesOT(ordemId),
    enabled: Boolean(ordemId),
  });
  return { utilizacoes: query.data ?? [], isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}

export function useRegistrarUtilizacaoOT(ordemId: string) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (values: Parameters<typeof registrarUtilizacaoOT>[1]) => registrarUtilizacaoOT(ordemId, values),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['utilizacoes-ot', ordemId] }),
        client.invalidateQueries({ queryKey: ['ordens-transporte'] }),
        client.invalidateQueries({ queryKey: ['ordem-transporte', ordemId] }),
      ]);
    },
  });
  return { registrar: mutation.mutateAsync, isSubmitting: mutation.isPending, error: mutation.error };
}

export function useFinalizarOrdemTransporte(ordemId: string) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => finalizarOrdemTransporte(ordemId),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['ordens-transporte'] }),
        client.invalidateQueries({ queryKey: ['utilizacoes-ot', ordemId] }),
      ]);
    },
  });
  return { finalizar: mutation.mutateAsync, isFinalizing: mutation.isPending, error: mutation.error };
}
