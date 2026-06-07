"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Eye,
  Edit,
  Search,
  Ban,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  TableActionButton,
} from "@/components/ui/table-actions";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
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
import { useCotacoes } from "@/hooks/use-cotacoes";
import { useUsuario } from "@/hooks/use-usuario";
import { isCotacaoVencida, formatCotacaoNumero, formatDateOnly } from "@/lib/cotacoes-utils";
import { StatusBadge } from "@/components/shared/status-badge";

type FiltroAtivo = "todas" | "ativas" | "inativas";

export default function CotacoesPage() {
  const {
    cotacoes,
    isLoading,
    error,
    refetch,
    alternarStatus,
    isTogglingStatus,
  } = useCotacoes("todas");
  const { isGestor } = useUsuario();

  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroAtivo>("todas");
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const cotacoesFiltradas = useMemo(() => {
    return cotacoes.filter((cotacao) => {
      const matchAtivo =
        filtroAtivo === "todas" ||
        (filtroAtivo === "ativas" && cotacao.ativo) ||
        (filtroAtivo === "inativas" && !cotacao.ativo);

      const termo = busca.toLowerCase();
      const matchBusca =
        !termo ||
        cotacao.descricao.toLowerCase().includes(termo) ||
        (cotacao.pacienteNome?.toLowerCase().includes(termo) ?? false) ||
        (cotacao.numero?.toLowerCase().includes(termo) ?? false) ||
        cotacao.id.toLowerCase().includes(termo) ||
        cotacao.id.slice(0, 8).toUpperCase().includes(termo.toUpperCase());

      return matchAtivo && matchBusca;
    });
  }, [cotacoes, busca, filtroAtivo]);

  const total = cotacoesFiltradas.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const displayedCotacoes = cotacoesFiltradas.slice(startIndex, startIndex + pageSize);

  const handleToggleStatus = async (id: string, ativo: boolean, descricao: string) => {
    const acao = ativo ? "inativar" : "ativar";
    if (!window.confirm(`Deseja ${acao} a cotação "${descricao}"?`)) return;

    setActionError(null);
    try {
      await alternarStatus(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Erro ao ${acao} cotação.`);
    }
  };

  return (
    <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cotações</h1>
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
            <AlertTitle>Erro ao carregar cotações</AlertTitle>
            <AlertDescription className="flex items-center gap-4">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {actionError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro na operação</AlertTitle>
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lista de Cotações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
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
                value={filtroAtivo}
                onValueChange={(v) => {
                  setFiltroAtivo(v as FiltroAtivo);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="ativas">Ativas</SelectItem>
                  <SelectItem value="inativas">Inativas</SelectItem>
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
                    <TableHead>Número</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead className="text-center">Itens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedCotacoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Empty>
                          <EmptyTitle>Nenhuma cotação encontrada</EmptyTitle>
                          <EmptyDescription>
                            {busca || filtroAtivo !== "todas"
                              ? "Tente ajustar os filtros de busca."
                              : isGestor
                                ? "Crie a primeira cotação para começar."
                                : "Não há cotações cadastradas."}
                          </EmptyDescription>
                          {isGestor && !busca && filtroAtivo === "todas" && (
                            <Button asChild className="mt-4">
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
                        cotacao.ativo && isCotacaoVencida(cotacao.dataValidade);

                      return (
                        <TableRow key={cotacao.id}>
                          <TableCell className="font-mono text-sm">
                            {formatCotacaoNumero(cotacao)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate font-medium">
                            {cotacao.descricao}
                          </TableCell>
                          <TableCell>{cotacao.pacienteNome ?? "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {formatDateOnly(cotacao.dataValidade)}
                              {vencida && (
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {cotacao.itens.length}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={cotacao.ativo ? "ativo" : "inativo"}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end">
                              <TableActions>
                                <TableActionLink href={`/cotacoes/${cotacao.id}`}>
                                  <span className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" /> Visualizar
                                  </span>
                                </TableActionLink>
                                {isGestor && (
                                  <>
                                    <TableActionLink
                                      href={`/cotacoes/${cotacao.id}/editar`}
                                    >
                                      <span className="flex items-center gap-2">
                                        <Edit className="h-4 w-4" /> Editar
                                      </span>
                                    </TableActionLink>
                                    <TableActionButton
                                      onSelect={() =>
                                        void handleToggleStatus(
                                          cotacao.id,
                                          cotacao.ativo,
                                          cotacao.descricao,
                                        )
                                      }
                                      disabled={isTogglingStatus}
                                    >
                                      <span className="flex items-center gap-2">
                                        {cotacao.ativo ? (
                                          <Ban className="h-4 w-4" />
                                        ) : (
                                          <CheckCircle className="h-4 w-4" />
                                        )}
                                        {cotacao.ativo ? "Inativar" : "Ativar"}
                                      </span>
                                    </TableActionButton>
                                  </>
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
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-disabled={page === 1}
                    />
                  </PaginationItem>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
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
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
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
