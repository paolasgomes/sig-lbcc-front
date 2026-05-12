"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarAreas,
  mapApiAreaToArea,
  criarArea as criarAreaApi,
  atualizarArea as atualizarAreaApi,
  inativarArea as inativarAreaApi,
} from "@/services/areas-service";
import { AreaAtendimento, AreaCreateInput, AreaUpdateInput } from "@/types";

function gerarAreaIdFallback() {
  return `area-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAreas() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      const dados = await listarAreas();
      return dados.map((area, index) =>
        mapApiAreaToArea(area, area.id || `area-list-${index}`),
      ) as AreaAtendimento[];
    },
    staleTime: 1000 * 60,
  });

  async function addArea(area: Partial<AreaAtendimento>) {
    const payload: AreaCreateInput = {
      nome: area.nome ?? "",
      descricao: area.descricao ?? "",
    };

    const areaCriada = await criarAreaApi(payload);
    const areaMapeada = mapApiAreaToArea(
      areaCriada,
      areaCriada.id || gerarAreaIdFallback(),
    );

    await queryClient.invalidateQueries({ queryKey: ["areas"] });

    return areaMapeada;
  }

  async function updateArea(id: string, dados: Partial<AreaAtendimento>) {
    const payload: AreaUpdateInput = {
      nome: dados.nome,
      descricao: dados.descricao,
    };

    const areaAtualizada = await atualizarAreaApi(id, payload);
    const areaMapeada = mapApiAreaToArea(areaAtualizada, areaAtualizada.id || id);

    await queryClient.invalidateQueries({ queryKey: ["areas"] });

    return areaMapeada;
  }

  async function deleteArea(id: string) {
    await inativarAreaApi(id);
    await queryClient.invalidateQueries({ queryKey: ["areas"] });
  }

  return {
    areas: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    addArea,
    updateArea,
    deleteArea,
    query,
  };
}
