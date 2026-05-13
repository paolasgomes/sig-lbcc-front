"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listarUsuarios, excluirUsuario } from "@/services/usuarios-service";
import { UsuarioDTO } from "@/types";

export function useUsuarios() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const dados = await listarUsuarios();
      return dados as UsuarioDTO[];
    },
    staleTime: 1000 * 60,
  });

  async function deleteUsuario(id: string) {
    await excluirUsuario(id);
    await queryClient.invalidateQueries({ queryKey: ["usuarios"] });
  }

  return {
    usuarios: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    deleteUsuario,
    query,
  };
}
