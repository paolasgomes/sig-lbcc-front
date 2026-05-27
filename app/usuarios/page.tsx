"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Eye, Edit, Filter, Search, Trash2, Ban } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { TableLoading } from "@/components/ui/table-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { useUsuarios } from "@/hooks/use-usuarios";
import { PerfilUsuario } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { StatusBadge } from "@/components/shared/status-badge";
import { PERFIS_GESTAO_BASE } from "@/lib/access-control";

const PERFIL_LABEL: Record<PerfilUsuario, string> = {
  [PerfilUsuario.OPERADOR]: "Operador",
  [PerfilUsuario.GESTOR]: "Gestor",
  [PerfilUsuario.PREFEITURA]: "Prefeitura",
};

export default function UsuariosPage() {
  const {
    usuarios,
    isLoading: usuariosLoading,
    error: usuariosError,
    refetch: refreshUsuarios,
    deleteUsuario,
    inactiveUsuario,
  } = useUsuarios();
  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState<string>("todos");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      if (!usuario) {
        return false;
      }

      const nome = typeof usuario.nome === "string" ? usuario.nome : "";
      const email = typeof usuario.email === "string" ? usuario.email : "";

      const matchBusca =
        nome.toLowerCase().includes(busca.toLowerCase()) ||
        email.toLowerCase().includes(busca.toLowerCase());

      const matchPerfil = filtroPerfil === "todos" || usuario.perfil === filtroPerfil;

      return matchBusca && matchPerfil;
    });
  }, [usuarios, busca, filtroPerfil]);

  const temFiltroAtivo = busca.trim().length > 0 || filtroPerfil !== "todos";

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const total = usuariosFiltrados.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedUsuarios = usuariosFiltrados.slice(startIndex, endIndex);

  const handleDelete = async (usuarioId: string, usuarioNome: string) => {
    const confirmar = window.confirm(`Excluir o usuário ${usuarioNome}?`);

    if (!confirmar) {
      return;
    }

    setDeleteError(null);
    setDeletingId(usuarioId);

    try {
      await deleteUsuario(usuarioId);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Erro ao excluir usuário.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleInactive = async (usuarioId: string, usuarioNome: string) => {
    const confirmar = window.confirm(`Inativar o usuário ${usuarioNome}?`);

    if (!confirmar) {
      return;
    }

    setDeleteError(null);
    setDeletingId(usuarioId);

    try {
      await inactiveUsuario(usuarioId);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Erro ao inativar usuário.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
            <p className="text-muted-foreground">
              Gerencie os usuários cadastrados no sistema
            </p>
          </div>
          <Button asChild>
            <Link href="/usuarios/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Link>
          </Button>
        </div>

        {usuariosError && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível carregar os usuários</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{usuariosError}</span>
              <Button variant="outline" onClick={() => void refreshUsuarios()}>
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
                  placeholder="Buscar por nome ou email..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filtroPerfil} onValueChange={setFiltroPerfil}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os perfis</SelectItem>
                  <SelectItem value={PerfilUsuario.OPERADOR}>Operador</SelectItem>
                  <SelectItem value={PerfilUsuario.GESTOR}>Gestor</SelectItem>
                  <SelectItem value={PerfilUsuario.PREFEITURA}>Prefeitura</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {deleteError && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível excluir o usuário</AlertTitle>
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="p-0">
            {usuariosLoading ? (
              <TableLoading message="Carregando usuários..." />
            ) : usuariosFiltrados.length === 0 ? (
              <Empty className="py-12">
                <EmptyTitle>
                  {temFiltroAtivo
                    ? "Nenhum usuário encontrado"
                    : "Nenhum usuário cadastrado"}
                </EmptyTitle>
                <EmptyDescription>
                  {temFiltroAtivo
                    ? "Tente ajustar os filtros ou limpe a busca para ver todos os usuários."
                    : "Cadastre o primeiro usuário para iniciar o gerenciamento."}
                </EmptyDescription>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedUsuarios.map((usuario) => {
                    const hasVinculos = usuario.usuarioTemVinculos ?? false;

                    return (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.nome}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{PERFIL_LABEL[usuario.perfil]}</Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={usuario.ativo ? "ativo" : "inativo"} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <TableActions>
                              <TableActionLink href={`/usuarios/${usuario.id}`}>
                                <span className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" /> Visualizar
                                </span>
                              </TableActionLink>
                              <TableActionLink href={`/usuarios/${usuario.id}/editar`}>
                                <span className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" /> Editar
                                </span>
                              </TableActionLink>
                              <TableActionButton
                                variant="default"
                                onSelect={() =>
                                  void handleInactive(usuario.id, usuario.nome)
                                }
                              >
                                <span className="flex items-center gap-2">
                                  <Ban className="h-4 w-4" /> Inativar
                                </span>
                              </TableActionButton>
                              <TableActionButton
                                variant="destructive"
                                onSelect={() =>
                                  void handleDelete(usuario.id, usuario.nome)
                                }
                                title={
                                  hasVinculos
                                    ? "Não é possível excluir este usuário devido a vínculos existentes."
                                    : undefined
                                }
                                disabled={hasVinculos || deletingId === usuario.id}
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

        {!usuariosLoading && !usuariosError && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Exibindo {displayedUsuarios.length} de {usuariosFiltrados.length} usuários
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
