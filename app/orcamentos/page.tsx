"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Eye,
  Edit,
  Search,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

import TableActions, {
  TableActionLink,
  TableActionButton,
} from "@/components/ui/table-actions";

import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";

import { TableLoading } from "@/components/ui/table-state";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";
import { useOrcamentos } from "@/hooks/use-orcamentos";
import { useUsuario } from "@/hooks/use-usuario";
import { StatusBadge } from "@/components/shared/status-badge";

function formatDate(date?: string) {
  if (!date) return "-";

  const [year, month, day] = date.split("-");

  if (!year || !month || !day) {
    return date;
  }

  return `${day}/${month}/${year}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function OrcamentosPage() {
  const {
    orcamentos,
    isLoading,
    error,
    refetch,
    excluir,
  } = useOrcamentos();

  const { isGestor } = useUsuario();

  const [busca, setBusca] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  const pageSize = 10;

  const orcamentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return orcamentos;
    }

    return orcamentos.filter((orcamento) => {
      return (
        orcamento.id.toLowerCase().includes(termo) ||
        orcamento.id
          .slice(0, 8)
          .toLowerCase()
          .includes(termo) ||
        (orcamento.cotacaoNome
          ?.toLowerCase()
          .includes(termo) ??
          false) ||
        (orcamento.fornecedorNome
          ?.toLowerCase()
          .includes(termo) ??
          false)
      );
    });
  }, [orcamentos, busca]);

  const total = orcamentosFiltrados.length;

  const pageCount = Math.max(
    1,
    Math.ceil(total / pageSize),
  );

  const startIndex = (page - 1) * pageSize;

  const displayedOrcamentos =
    orcamentosFiltrados.slice(
      startIndex,
      startIndex + pageSize,
    );

  const handleExcluir = async (
    id: string,
    fornecedorNome?: string,
  ) => {
    const nome = fornecedorNome || "este orçamento";

    if (
      !window.confirm(
        `Deseja realmente excluir o orçamento de "${nome}"?`,
      )
    ) {
      return;
    }

    setActionError(null);
    setIsDeleting(true);

    try {
      await excluir(id);

      const novaQuantidade = total - 1;

      const novaPageCount = Math.max(
        1,
        Math.ceil(novaQuantidade / pageSize),
      );

      if (page > novaPageCount) {
        setPage(novaPageCount);
      }
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Erro ao excluir orçamento.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout
      allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}
    >
      <div className="flex flex-col gap-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Orçamentos
            </h1>

            <p className="text-muted-foreground">
              Gerencie os orçamentos e propostas das cotações
            </p>
          </div>

          {isGestor && (
            <Button asChild>
              <Link href="/orcamentos/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Orçamento
              </Link>
            </Button>
          )}
        </div>

        {/* Erro ao carregar */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />

            <AlertTitle>
              Erro ao carregar orçamentos
            </AlertTitle>

            <AlertDescription className="flex items-center gap-4">
              <span>{error}</span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Erro de operação */}
        {actionError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />

            <AlertTitle>
              Erro na operação
            </AlertTitle>

            <AlertDescription>
              {actionError}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              Lista de Orçamentos
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Busca */}
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  placeholder="Buscar por cotação ou fornecedor..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Loading */}
            {isLoading ? (
              <TableLoading message="Carregando orçamentos..." />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cotação</TableHead>

                      <TableHead>
                        Fornecedor
                      </TableHead>

                      <TableHead>
                        Data da proposta
                      </TableHead>

                      <TableHead>
                        Validade
                      </TableHead>

                      <TableHead className="text-right">
                        Valor total
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead className="w-[100px]">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {displayedOrcamentos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Empty>
                            <EmptyTitle>
                              Nenhum orçamento encontrado
                            </EmptyTitle>

                            <EmptyDescription>
                              {busca
                                ? "Tente ajustar o termo de busca."
                                : isGestor
                                  ? "Cadastre o primeiro orçamento para começar."
                                  : "Não há orçamentos cadastrados."}
                            </EmptyDescription>

                            {isGestor && !busca && (
                              <Button
                                asChild
                                className="mt-4"
                              >
                                <Link href="/orcamentos/novo">
                                  <Plus className="mr-2 h-4 w-4" />
                                  Novo Orçamento
                                </Link>
                              </Button>
                            )}
                          </Empty>
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedOrcamentos.map(
                        (orcamento) => (
                          <TableRow
                            key={orcamento.id}
                          >
                            {/* Cotação */}
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {orcamento.cotacaoNome ??
                                    "Cotação não informada"}
                                </span>

                                <span className="font-mono text-xs text-muted-foreground">
                                  {orcamento.cotacaoId.slice(
                                    0,
                                    8,
                                  ).toUpperCase()}
                                </span>
                              </div>
                            </TableCell>

                            {/* Fornecedor */}
                            <TableCell>
                              {orcamento.fornecedorNome ??
                                "Fornecedor não informado"}
                            </TableCell>

                            {/* Data proposta */}
                            <TableCell>
                              {formatDate(
                                orcamento.dataProposta,
                              )}
                            </TableCell>

                            {/* Validade */}
                            <TableCell>
                              {formatDate(
                                orcamento.validadeProposta,
                              )}
                            </TableCell>

                            {/* Valor */}
                            <TableCell className="text-right font-medium">
                              {formatCurrency(
                                orcamento.valorTotal,
                              )}
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              {orcamento.selecionada ? (
                                <StatusBadge status="ativo" />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-muted-foreground" />

                                  <span className="text-sm text-muted-foreground">
                                    Não selecionada
                                  </span>
                                </div>
                              )}
                            </TableCell>

                            {/* Ações */}
                            <TableCell>
                              <div className="flex items-center justify-end">
                                <TableActions>
                                  <TableActionLink
                                    href={`/orcamentos/${orcamento.id}`}
                                  >
                                    <span className="flex items-center gap-2">
                                      <Eye className="h-4 w-4" />
                                      Visualizar
                                    </span>
                                  </TableActionLink>

                                  {isGestor && (
                                    <>
                                      <TableActionLink
                                        href={`/orcamentos/${orcamento.id}/editar`}
                                      >
                                        <span className="flex items-center gap-2">
                                          <Edit className="h-4 w-4" />
                                          Editar
                                        </span>
                                      </TableActionLink>

                                      <TableActionButton
                                        onSelect={() =>
                                          void handleExcluir(
                                            orcamento.id,
                                            orcamento.fornecedorNome,
                                          )
                                        }
                                        disabled={isDeleting}
                                      >
                                        <span className="flex items-center gap-2">
                                          <Trash2 className="h-4 w-4" />
                                          Excluir
                                        </span>
                                      </TableActionButton>
                                    </>
                                  )}
                                </TableActions>
                              </div>
                            </TableCell>
                          </TableRow>
                        ),
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Paginação */}
            {!isLoading && total > pageSize && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setPage((p) =>
                          Math.max(1, p - 1),
                        )
                      }
                      aria-disabled={page === 1}
                    />
                  </PaginationItem>

                  {Array.from(
                    { length: pageCount },
                    (_, i) => i + 1,
                  ).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        isActive={p === page}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) =>
                          Math.min(
                            pageCount,
                            p + 1,
                          ),
                        )
                      }
                      aria-disabled={
                        page === pageCount
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}