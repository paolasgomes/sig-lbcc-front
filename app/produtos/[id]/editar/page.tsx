"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProdutoForm } from "@/components/produtos/produto-form";
import { useData } from "@/contexts/data-context";
import { obterProduto, mapApiProdutoToProduto } from "@/services/produtos-service";
import type { Produto } from "@/types";
import { PERFIS_GESTAO_BASE } from "@/lib/access-control";

interface EditarProdutoPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarProdutoPage({ params }: EditarProdutoPageProps) {
  const { id } = use(params);
  const { produtos } = useData();
  const [produtoCarregado, setProdutoCarregado] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);

  const produtoLocal = produtos.find((p) => p.id === id);

  useEffect(() => {
    if (produtoLocal) {
      setProdutoCarregado(produtoLocal);
      setLoading(false);
    } else {
      // Se não encontrar na context, busca da API
      obterProduto(id)
        .then((produtoApi) => {
          setProdutoCarregado(mapApiProdutoToProduto(produtoApi));
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [id, produtoLocal]);

  if (loading) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
        <div>Carregando...</div>
      </DashboardLayout>
    );
  }

  if (!produtoCarregado) {
    notFound();
  }

  return (
    <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
      <ProdutoForm produto={produtoCarregado} modo="editar" />
    </DashboardLayout>
  );
}
