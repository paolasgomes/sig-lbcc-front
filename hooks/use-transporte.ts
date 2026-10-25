
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  emitirOrdemTransporte,
  emitirSegundaViaVoucher,
  registrarEntregaVoucher,
  type EmitirOrdemTransporteInput,
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
