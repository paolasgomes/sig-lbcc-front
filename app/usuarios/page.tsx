"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Eye, Edit, Filter, Search, Trash2 } from "lucide-react";
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
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useData } from "@/contexts/data-context";
import { PerfilUsuario } from "@/types";

const PERFIL_LABEL: Record<PerfilUsuario, string> = {
  [PerfilUsuario.OPERADOR]: "Operador",
  [PerfilUsuario.GESTOR]: "Gestor",
  [PerfilUsuario.PREFEITURA]: "Prefeitura",
};

export default function UsuariosPage() {
  const { usuarios, usuariosLoading, usuariosError, refreshUsuarios, deleteUsuario } =
    useData();
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

  return (
    <DashboardLayout>
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
              <div className="flex min-h-64 items-center justify-center gap-3 py-12 text-muted-foreground">
                <Spinner className="h-5 w-5" />
                <span>Carregando usuários...</span>
              </div>
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
                  {usuariosFiltrados.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">{usuario.nome}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{PERFIL_LABEL[usuario.perfil]}</Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            usuario.ativo
                              ? "text-success font-medium"
                              : "text-muted-foreground font-medium"
                          }
                        >
                          {usuario.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/usuarios/${usuario.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Visualizar</span>
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/usuarios/${usuario.id}/editar`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleDelete(usuario.id, usuario.nome)}
                            disabled={deletingId === usuario.id}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {!usuariosLoading && !usuariosError && (
          <div className="text-sm text-muted-foreground">
            Exibindo {usuariosFiltrados.length} de {usuarios.length} usuários
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
