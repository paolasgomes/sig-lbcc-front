"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Package } from "lucide-react";
import { mapApiProdutoToProduto, obterProduto } from "@/services/produtos-service";
import { Produto } from "@/types";

interface ProdutoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProdutoDetailPage({ params }: ProdutoDetailPageProps) {
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
      <ProtectedRoute allowedRoles={["admin", "gestor"]}>
        <DashboardLayout>
          <div>Carregando...</div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!produtoCarregado) {
    notFound();
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor"]}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/produtos">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {produtoCarregado.nome || produtoCarregado.descricao}
                  </h1>
                  <Badge variant={produtoCarregado.ativo ? "default" : "secondary"}>
                    {produtoCarregado.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{produtoCarregado.descricao}</p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/produtos/${produtoCarregado.id}/editar`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Detalhes do Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Unidade</p>
                  <p>{produtoCarregado.unidade || produtoCarregado.unidadeMedida}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Preco Referencia</p>
                  <p>
                    {produtoCarregado.precoReferencia
                      ? `R$ ${produtoCarregado.precoReferencia.toFixed(2)}`
                      : "-"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
