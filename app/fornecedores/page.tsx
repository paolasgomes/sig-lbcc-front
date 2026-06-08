"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Eye,
  Edit,
  Filter,
  Search,
  Trash2,
  Ban,
  CheckCircle,
  Building2,
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
import { useFornecedores } from "@/hooks/use-fornecedores";
import { StatusBadge } from "@/components/shared/status-badge";
import { PERFIS_GESTAO_BASE } from "@/lib/access-control";
import { formatCnpj, formatPhone } from "@/lib/formatters";
import type { Fornecedor } from "@/types";

export default function FornecedoresPage() {
  const {
    fornecedores,
    isLoading,
    error,
    refetch,
    alternarStatusFornecedor,
    excluirFornecedor,
  } = useFornecedores();

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores.filter((fornecedor) => {
      const termo = busca.toLowerCase();
      const matchBusca =
        fornecedor.razaoSocial.toLowerCase().includes(termo) ||
        (fornecedor.nomeFantasia ?? "").toLowerCase().includes(termo) ||
        (fornecedor.cnpj ?? "").includes(busca);

      const matchStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativos" && fornecedor.ativo) ||
        (filtroStatus === "inativos" && !fornecedor.ativo);

      return matchBusca && matchStatus;
    });
  }, [fornecedores, busca, filtroStatus]);

  const temFiltroAtivo = busca.trim().length > 0 || filtroStatus !== "todos";
  const total = fornecedoresFiltrados.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const displayedFornecedores = fornecedoresFiltrados.slice(
    startIndex,
    startIndex + pageSize,
  );

  const handleToggleStatus = async (fornecedor: Fornecedor) => {
    const nome = fornecedor.nomeFantasia ?? fornecedor.razaoSocial;
    const acao = fornecedor.ativo ? "Inativar" : "Reativar";
    if (!window.confirm(`${acao} o fornecedor ${nome}?`)) return;

    setActionError(null);
    setActionId(fornecedor.id);
    try {
      await alternarStatusFornecedor(fornecedor.id);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : `Erro ao ${acao.toLowerCase()} fornecedor.`,
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (fornecedor: Fornecedor) => {
    const nome = fornecedor.nomeFantasia ?? fornecedor.razaoSocial;
    if (!window.confirm(`Excluir o fornecedor ${nome}?`)) return;

    setActionError(null);
    setActionId(fornecedor.id);
    try {
      await excluirFornecedor(fornecedor.id);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Erro ao excluir fornecedor.",
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
            <p className="text-muted-foreground">
              Gerencie os fornecedores de produtos e serviços
            </p>
          </div>
          <Button asChild>
            <Link href="/fornecedores/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível carregar os fornecedores</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <Button variant="outline" onClick={() => void refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CNPJ..."
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
                  setFiltroStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativos">Ativos</SelectItem>
                  <SelectItem value="inativos">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {actionError && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível concluir a ação</AlertTitle>
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Fornecedores Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableLoading message="Carregando fornecedores..." />
            ) : fornecedoresFiltrados.length === 0 ? (
              <Empty className="py-12">
                <EmptyTitle>
                  {temFiltroAtivo
                    ? "Nenhum fornecedor encontrado"
                    : "Nenhum fornecedor cadastrado"}
                </EmptyTitle>
                <EmptyDescription>
                  {temFiltroAtivo
                    ? "Tente ajustar os filtros ou limpe a busca."
                    : "Cadastre o primeiro fornecedor para iniciar o gerenciamento."}
                </EmptyDescription>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Fantasia</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedFornecedores.map((fornecedor) => {
                    const displayName =
                      fornecedor.nomeFantasia ?? fornecedor.razaoSocial;
                    const hasVinculos = fornecedor.fornecedorTemVinculos ?? false;
                    const isBusy = actionId === fornecedor.id;

                    return (
                      <TableRow key={fornecedor.id}>
                        <TableCell className="font-medium">{displayName}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {fornecedor.cnpj ? formatCnpj(fornecedor.cnpj) : "—"}
                        </TableCell>
                        <TableCell>
                          {fornecedor.telefone
                            ? formatPhone(fornecedor.telefone)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={fornecedor.ativo ? "ativo" : "inativo"}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <TableActions disabled={isBusy}>
                              <TableActionLink href={`/fornecedores/${fornecedor.id}`}>
                                <span className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" /> Visualizar
                                </span>
                              </TableActionLink>
                              <TableActionLink
                                href={`/fornecedores/${fornecedor.id}/editar`}
                              >
                                <span className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" /> Editar
                                </span>
                              </TableActionLink>
                              {fornecedor.ativo ? (
                                <TableActionButton
                                  variant="default"
                                  onSelect={() => void handleToggleStatus(fornecedor)}
                                >
                                  <span className="flex items-center gap-2">
                                    <Ban className="h-4 w-4" /> Inativar
                                  </span>
                                </TableActionButton>
                              ) : (
                                <TableActionButton
                                  variant="default"
                                  onSelect={() => void handleToggleStatus(fornecedor)}
                                >
                                  <span className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" /> Reativar
                                  </span>
                                </TableActionButton>
                              )}
                              <TableActionButton
                                variant="destructive"
                                disabled={hasVinculos}
                                title={
                                  hasVinculos
                                    ? "Fornecedor com vínculos não pode ser excluído"
                                    : undefined
                                }
                                onSelect={() => void handleDelete(fornecedor)}
                              >
                                <span className="flex items-center gap-2">
                                  <Trash2 className="h-4 w-4" /> Excluir
                                </span>
                              </TableActionButton>
                            </TableActions>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {!isLoading && !error && fornecedoresFiltrados.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Exibindo {displayedFornecedores.length} de {total} fornecedores
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
  );
}
