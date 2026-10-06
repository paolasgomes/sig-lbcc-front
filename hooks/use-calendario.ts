"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  alternarStatusFeriado,
  atualizarFeriado,
  criarFeriado,
  listarFeriados,
} from "@/services/calendario-service";
import type { Feriado } from "@/services/calendario-service";

const QUERY_KEY = ["calendario-feriados"];

export function useCalendario() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listarFeriados,
    staleTime: 1000 * 60,
  });

  const invalidar = () => {
    return queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  };

  const criar = useMutation({
    mutationFn: criarFeriado,
    onSuccess: (feriado) => {
      queryClient.setQueryData<Feriado[]>(QUERY_KEY, (atual) =>
        atual ? [...atual, feriado].sort((a, b) => a.data.localeCompare(b.data)) : atual,
      );
      return invalidar();
    },
  });

  const editar = useMutation({
    mutationFn: ({ id, data, nome }: { id: string; data: string; nome: string }) =>
      atualizarFeriado(id, { data, nome }),
    onSuccess: (feriado) => {
      queryClient.setQueryData<Feriado[]>(QUERY_KEY, (atual) =>
        atual?.map((item) => (item.id === feriado.id ? feriado : item)),
      );
      return invalidar();
    },
  });

  const alternar = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      alternarStatusFeriado(id, ativo),
    onSuccess: (feriado) => {
      queryClient.setQueryData<Feriado[]>(QUERY_KEY, (atual) =>
        atual?.map((item) => (item.id === feriado.id ? feriado : item)),
      );
      return invalidar();
    },
  });

  return {
    feriados: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : query.error ?? null,
    refetch: query.refetch,
    criar,
    editar,
    alternar,
  };
}
