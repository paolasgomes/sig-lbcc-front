
"use client";


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listarOrdensDeTransporte,
  listarVouchersTransporte,
  atualizarOrdemDeTransporte,
  emitirOrdemTransporte,
  emitirSegundaViaVoucher,
  registrarEntregaVoucher,
  type AtualizarOrdemTransporteInput,
  type EmitirOrdemTransporteInput,
  type VoucherTransporte,
} from "@/services/transporte-service";


export function useEmitirOrdemTransporte() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (dados: EmitirOrdemTransporteInput) =>
      emitirOrdemTransporte(dados),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["cotacoes"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ordens-transporte"],
        }),
      ]);
    },
  });

  return {
    emitirOrdem: mutation.mutateAsync,
    isEmitting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useEmitirSegundaViaVoucher() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (ordemId: string) =>
      emitirSegundaViaVoucher(ordemId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["ordens-transporte"],
      });
    },
  });

  return {
    emitirSegundaVia: mutation.mutateAsync,
    isEmitting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

interface RegistrarEntregaInput {
  ordemId: string;
  voucherId: string;
  destinatario: string;
}

export function useRegistrarEntregaVoucher() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      ordemId,
      voucherId,
      destinatario,
    }: RegistrarEntregaInput) =>
      registrarEntregaVoucher(
        ordemId,
        voucherId,
        destinatario,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["ordens-transporte"],
      });
    },
  });

  return {
    registrarEntrega: mutation.mutateAsync,
    isRegistering: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useOrdensDeTransporte() {
  const query = useQuery({
    queryKey: ["ordens-transporte"],
    queryFn: listarOrdensDeTransporte,
  });

  return {
    ordens: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
export function useVouchersTransporte(ordemId: string) {
  const query = useQuery({
    queryKey: ["ordens-transporte", ordemId, "vouchers"],
    queryFn: () => listarVouchersTransporte(ordemId),
    enabled: Boolean(ordemId),
  });

  return {
    vouchers: query.data ?? ([] as VoucherTransporte[]),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
export function useAtualizarOrdemDeTransporte() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      dados,
    }: {
      id: string;
      dados: Partial<AtualizarOrdemTransporteInput>;
    }) => atualizarOrdemDeTransporte(id, dados),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["ordens-transporte"],
      });
    },
  });

  return {
    atualizarOrdem: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
