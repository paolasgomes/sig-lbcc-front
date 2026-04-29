"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Eye,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function ProdutosPage() {
  const { produtos, produtosLoading, produtosError, desativarProduto } = useData();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const matchBusca =
        produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
        produto.descricao.toLowerCase().includes(busca.toLowerCase());

      const matchStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativos" && produto.ativo) ||
        (filtroStatus === "inativos" && !produto.ativo);

      return matchBusca && matchStatus;
    });
  }, [produtos, busca, filtroStatus]);

  const temFiltroAtivo = busca.trim().length > 0 || filtroStatus !== "todos";

  const handleDesativar = async (id: string) => {
    if (!confirm("Tem certeza que deseja desativar este produto?")) return;
    setDeactivatingId(id);
    try {
      await desativarProduto(id);
    } catch (error) {
      console.error("Erro ao desativar produto:", error);
    } finally {
      setDeactivatingId(null);
    }
  };

  if (produtosError) {
    return (
      <ProtectedRoute allowedRoles={["admin", "gestor", "operador"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="font-semibold">{produtosError}</p>
                    <Button
                      onClick={() => location.reload()}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor", "operador"]}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Produtos e Serviços</h1>
              <p className="text-muted-foreground">Gerencie o catálogo de produtos</p>
            </div>
            <Button asChild>
              <Link href="/produtos/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou descrição..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativos">Ativos</SelectItem>
                    <SelectItem value="inativos">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {temFiltroAtivo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBusca("");
                    setFiltroStatus("todos");
                  }}
                  className="mt-2"
                >
                  Limpar Filtros
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <CardDescription>
                {produtosFiltrados.length} de {produtos.length} produto(s)
                {temFiltroAtivo && " (filtrado)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {produtosLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-20 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-muted-foreground"
                          >
                            {temFiltroAtivo
                              ? "Nenhum produto encontrado com os filtros aplicados."
                              : "Nenhum produto cadastrado."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        produtosFiltrados.map((produto) => (
                          <TableRow key={produto.id}>
                            <TableCell className="font-medium">{produto.nome}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {produto.descricao}
                            </TableCell>
                            <TableCell>{produto.unidade}</TableCell>
                            <TableCell>
                              <Badge variant={produto.ativo ? "default" : "secondary"}>
                                {produto.ativo ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={deactivatingId !== null}
                                  >
                                    {deactivatingId === produto.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Ações</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/produtos/${produto.id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Visualizar
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/produtos/${produto.id}/editar`}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Editar
                                    </Link>
                                  </DropdownMenuItem>
                                  {produto.ativo && (
                                    <DropdownMenuItem
                                      onClick={() => handleDesativar(produto.id)}
                                      className="text-destructive"
                                    >
                                      <AlertCircle className="mr-2 h-4 w-4" />
                                      Desativar
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
