"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Package } from "lucide-react";

interface ProdutoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProdutoDetailPage({ params }: ProdutoDetailPageProps) {
  const { id } = use(params);
  const { produtos } = useData();
  const produto = produtos.find((p) => p.id === id);

  if (!produto) {
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
                    {produto.nome || produto.descricao}
                  </h1>
                  <Badge variant={produto.ativo ? "default" : "secondary"}>
                    {produto.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{produto.descricao}</p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/produtos/${produto.id}/editar`}>
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
                  <p>{produto.unidade || produto.unidadeMedida}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p>{produto.fornecedorId || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preco Referencia</p>
                  <p>
                    {produto.precoReferencia
                      ? `R$ ${produto.precoReferencia.toFixed(2)}`
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
