"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Eye,
  Edit,
  Search,
  AlertTriangle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

import {
  ROLES_ATENDIMENTOS_E_COTACOES,
} from "@/lib/access-control";

import { useCotacoes } from "@/hooks/use-cotacoes";
import { useUsuario } from "@/hooks/use-usuario";

import {
  isCotacaoVencida,
  formatCotacaoNumero,
  formatDateOnly,
} from "@/lib/cotacoes-utils";

import { StatusBadge } from "@/components/shared/status-badge";

import type { StatusCotacao } from "@/types";

type FiltroStatus = "todos" | StatusCotacao;

export default function CotacoesPage() {
  const {
    cotacoes,
    isLoading,
    error,
    refetch,
  } = useCotacoes();

  const { isGestor } = useUsuario();

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatus>("todos");

  const [page, setPage] = useState(1);

  const pageSize = 10;

  const cotacoesFiltradas = useMemo(() => {
    return cotacoes.filter((cotacao) => {
      const matchStatus =
        filtroStatus === "todos" ||
        cotacao.status === filtroStatus;

      const termo = busca.trim().toLowerCase();

      const matchBusca =
        !termo ||
        cotacao.descricao
          .toLowerCase()
          .includes(termo) ||
        (cotacao.pacienteNome
          ?.toLowerCase()
          .includes(termo) ??
          false) ||
        (cotacao.numero
          ?.toLowerCase()
          .includes(termo) ??
          false) ||
        cotacao.id
          .toLowerCase()
          .includes(termo) ||
        cotacao.id
          .slice(0, 8)
          .toUpperCase()
          .includes(termo.toUpperCase());

      return matchStatus && matchBusca;
    });
  }, [cotacoes, busca, filtroStatus]);

  const total = cotacoesFiltradas.length;

  const pageCount = Math.max(
    1,
    Math.ceil(total / pageSize),
  );

  const startIndex = (page - 1) * pageSize;

  const displayedCotacoes = cotacoesFiltradas.slice(
    startIndex,
    startIndex + pageSize,
  );

  return (
    <DashboardLayout
      allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Cotações
            </h1>

            <p className="text-muted-foreground">
              Gerencie as cotações de produtos e serviços
            </p>
          </div>

          {isGestor && (
            <Button asChild>
              <Link href="/cotacoes/nova">
                <Plus className="mr-2 h-4 w-4" />
                Nova Cotação
              </Link>
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />

            <AlertTitle>
              Erro ao carregar cotações
            </AlertTitle>

            <AlertDescription className="flex items-center gap-4">
              <span>{error}</span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              Lista de Cotações
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  placeholder="Buscar por descrição, paciente ou número..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              <Select
                value={filtroStatus}
                onValueChange={(value) => {
                  setFiltroStatus(value as FiltroStatus);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="todos">
                    Todos os status
                  </SelectItem>

                  <SelectItem value="aberta">
                    Aberta
                  </SelectItem>

                  <SelectItem value="em_andamento">
                    Em andamento
                  </SelectItem>

                  <SelectItem value="pronta_para_analise">
                    Pronta para análise
                  </SelectItem>

                  <SelectItem value="finalizada">
                    Finalizada
                  </SelectItem>

                  <SelectItem value="cancelada">
                    Cancelada
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <TableLoading message="Carregando cotações..." />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Número
                      </TableHead>

                      <TableHead>
                        Descrição
                      </TableHead>

                      <TableHead>
                        Paciente
                      </TableHead>

                      <TableHead>
                        Validade
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead >
                        Itens
                      </TableHead>

                      <TableHead className="w-[100px]">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {displayedCotacoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Empty>
                            <EmptyTitle>
                              Nenhuma cotação encontrada
                            </EmptyTitle>

                            <EmptyDescription>
                              {busca ||
                              filtroStatus !== "todos"
                                ? "Tente ajustar os filtros de busca."
                                : isGestor
                                  ? "Crie a primeira cotação para começar."
                                  : "Não há cotações cadastradas."}
                            </EmptyDescription>

                            {isGestor &&
                              !busca &&
                              filtroStatus === "todos" && (
                                <Button
                                  asChild
                                  className="mt-4"
                                >
                                  <Link href="/cotacoes/nova">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nova Cotação
                                  </Link>
                                </Button>
                              )}
                          </Empty>
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedCotacoes.map((cotacao) => {
                        const vencida =
                          cotacao.status !== "cancelada" &&
                          cotacao.status !== "finalizada" &&
                          isCotacaoVencida(
                            cotacao.dataValidade,
                          );

                        const bloqueada =
                          cotacao.status === "finalizada" ||
                          cotacao.status === "cancelada";

                        return (
                          <TableRow key={cotacao.id}>
                            <TableCell className="font-mono text-sm">
                              {formatCotacaoNumero(cotacao)}
                            </TableCell>

                            <TableCell className="max-w-[200px] truncate font-medium">
                              {cotacao.descricao}
                            </TableCell>

                            <TableCell>
                              {cotacao.pacienteNome ?? "-"}
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-1">
                                {formatDateOnly(
                                  cotacao.dataValidade,
                                )}

                                {vencida && (
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <StatusBadge
                                status={cotacao.status}
                              />
                            </TableCell>

                            <TableCell className="text-center">
                              {cotacao.itens.length}
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center justify-start">
                                <TableActions>
                                  <TableActionLink
                                    href={`/cotacoes/${cotacao.id}`}
                                  >
                                    <span className="flex items-center gap-2">
                                      <Eye className="h-4 w-4" />
                                      Visualizar
                                    </span>
                                  </TableActionLink>

                                  {isGestor && !bloqueada && (
                                    <TableActionLink
                                      href={`/cotacoes/${cotacao.id}/editar`}
                                    >
                                      <span className="flex items-center gap-2">
                                        <Edit className="h-4 w-4" />
                                        Editar
                                      </span>
                                    </TableActionLink>
                                  )}
                                </TableActions>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {!isLoading && total > pageSize && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setPage((currentPage) =>
                          Math.max(1, currentPage - 1),
                        )
                      }
                      aria-disabled={page === 1}
                    />
                  </PaginationItem>

                  {Array.from(
                    {
                      length: pageCount,
                    },
                    (_, index) => index + 1,
                  ).map((currentPage) => (
                    <PaginationItem key={currentPage}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() =>
                          setPage(currentPage)
                        }
                      >
                        {currentPage}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((currentPage) =>
                          Math.min(
                            pageCount,
                            currentPage + 1,
                          ),
                        )
                      }
                      aria-disabled={page === pageCount}
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