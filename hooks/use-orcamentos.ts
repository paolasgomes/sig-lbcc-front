import { useCallback, useEffect, useState } from "react";

import {
  atualizarOrcamento,
  criarOrcamento,
  excluirOrcamento,
  listarOrcamentos,
  obterOrcamento,
} from "@/services/cotacao-propostas-service";

import type {
  Orcamento,
  OrcamentoCreateInput,
  OrcamentoUpdateInput,
} from "@/types";

interface UseOrcamentosResult {
  orcamentos: Orcamento[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;

  criar: (
    dados: OrcamentoCreateInput,
  ) => Promise<Orcamento>;

  atualizar: (
    id: string,
    dados: OrcamentoUpdateInput,
  ) => Promise<Orcamento>;

  excluir: (id: string) => Promise<void>;

  obter: (id: string) => Promise<Orcamento>;
}

export function useOrcamentos(
  cotacaoId?: string,
): UseOrcamentosResult {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(
    [],
  );

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );

  const carregarOrcamentos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dados = await listarOrcamentos(cotacaoId);

      setOrcamentos(dados);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar orçamentos.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [cotacaoId]);

  useEffect(() => {
    void carregarOrcamentos();
  }, [carregarOrcamentos]);

  const criar = useCallback(
    async (
      dados: OrcamentoCreateInput,
    ): Promise<Orcamento> => {
      const novoOrcamento =
        await criarOrcamento(dados);

      setOrcamentos((atual) => [
        novoOrcamento,
        ...atual,
      ]);

      return novoOrcamento;
    },
    [],
  );

  const atualizar = useCallback(
    async (
      id: string,
      dados: OrcamentoUpdateInput,
    ): Promise<Orcamento> => {
      const orcamentoAtualizado =
        await atualizarOrcamento(id, dados);

      setOrcamentos((atual) =>
        atual.map((orcamento) =>
          orcamento.id === id
            ? orcamentoAtualizado
            : orcamento,
        ),
      );

      return orcamentoAtualizado;
    },
    [],
  );

  const excluir = useCallback(
    async (id: string): Promise<void> => {
      await excluirOrcamento(id);

      setOrcamentos((atual) =>
        atual.filter(
          (orcamento) => orcamento.id !== id,
        ),
      );
    },
    [],
  );

  const obter = useCallback(
    async (id: string): Promise<Orcamento> => {
      return obterOrcamento(id);
    },
    [],
  );

  return {
    orcamentos,
    isLoading,
    error,
    refetch: carregarOrcamentos,
    criar,
    atualizar,
    excluir,
    obter,
  };
}