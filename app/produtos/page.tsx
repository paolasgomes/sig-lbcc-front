"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useProdutos } from "@/hooks/use-produtos";
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
import TableActions, {
  TableActionLink,
  TableActionButton,
} from "@/components/ui/table-actions";
import { TableLoading } from "@/components/ui/table-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { StatusBadge } from "@/components/shared/status-badge";

export default function ProdutosPage() {
  const {
    produtos,
    isLoading: produtosLoading,
    error: produtosError,
    desativarProduto,
  } = useProdutos();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      if (!produto) return false;

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

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const total = produtosFiltrados.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const displayedProdutos = produtosFiltrados.slice(startIndex, startIndex + pageSize);

  const handleExcluir = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    setDeactivatingId(id);
    setDeleteError(null);
    try {
      await desativarProduto(id);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Não foi possível excluir o produto.",
      );
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
              {deleteError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Não foi possível excluir o produto</AlertTitle>
                  <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
              )}
              {produtosLoading ? (
                <TableLoading message="Carregando produtos..." />
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
                      {displayedProdutos.length === 0 ? (
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
                        displayedProdutos.map((produto) => (
                          <TableRow key={produto.id}>
                            <TableCell className="font-medium">{produto.nome}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {produto.descricao}
                            </TableCell>
                            <TableCell>{produto.unidade}</TableCell>
                            <TableCell>
                              <StatusBadge status={produto.ativo ? "ativo" : "inativo"} />
                            </TableCell>
                            <TableCell>
                              <TableActions
                                trigger={
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
                                }
                              >
                                <TableActionLink href={`/produtos/${produto.id}`}>
                                  <span className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" /> Visualizar
                                  </span>
                                </TableActionLink>
                                <TableActionLink href={`/produtos/${produto.id}/editar`}>
                                  <span className="flex items-center gap-2">
                                    <Pencil className="h-4 w-4" /> Editar
                                  </span>
                                </TableActionLink>
                                {produto.ativo && (
                                  <TableActionButton
                                    variant="destructive"
                                    onSelect={() => handleExcluir(produto.id)}
                                  >
                                    <span className="flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4" /> Excluir
                                    </span>
                                  </TableActionButton>
                                )}
                              </TableActions>
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
          {!produtosLoading && !produtosError && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Exibindo {displayedProdutos.length} de {produtosFiltrados.length} produtos
              </div>
              {pageCount > 1 && (
                <Pagination aria-label="Pagination">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      />
                    </PaginationItem>
                    {Array.from({ length: pageCount }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setPage(i + 1)}
                          isActive={page === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
