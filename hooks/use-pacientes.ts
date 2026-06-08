"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarPacientes,
  obterPaciente,
  alterarStatusPaciente,
} from "@/services/pacientes-service";
import { mapApiPacienteToPaciente } from "@/lib/pacientes-utils";
import { StatusPaciente } from "@/types";

export function usePacientes() {
  const query = useQuery({
    queryKey: ["pacientes"],
    queryFn: async () => {
      const dados = await listarPacientes();
      return dados.map(mapApiPacienteToPaciente);
    },
  });

  return {
    pacientes: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error
        ? query.error.message
        : ((query.error as any) ?? null),
    refetch: query.refetch,
    query,
  };
}

export function usePaciente(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pacientes", id],
    queryFn: () => obterPaciente(id).then(mapApiPacienteToPaciente),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    queryClient.invalidateQueries({ queryKey: ["pacientes", id] });
    queryClient.invalidateQueries({ queryKey: ["historico", id] });
  };

  const alterarStatusMutation = useMutation({
    mutationFn: (status: StatusPaciente) =>
      alterarStatusPaciente(id, status),
    onSuccess: invalidate,
  });

  return {
    paciente: query.data ?? null,
    isLoading: query.isLoading,
    error:
      query.error instanceof Error
        ? query.error.message
        : ((query.error as any) ?? null),
    refetch: query.refetch,
    alterarStatus: alterarStatusMutation.mutateAsync,
    isAlterandoStatus: alterarStatusMutation.isPending,
    query,
  };
}
