"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Eye, Edit, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useData } from "@/contexts/data-context";
import { PerfilUsuario } from "@/types";

const PERFIL_LABEL: Record<PerfilUsuario, string> = {
  [PerfilUsuario.OPERADOR]: "Operador",
  [PerfilUsuario.GESTOR]: "Gestor",
  [PerfilUsuario.PREFEITURA]: "Prefeitura",
};

export default function UsuariosPage() {
  const { usuarios } = useData();
  const [busca, setBusca] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState<string>("todos");

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const matchBusca =
        usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
        usuario.email.toLowerCase().includes(busca.toLowerCase());

      const matchPerfil = filtroPerfil === "todos" || usuario.perfil === filtroPerfil;

      return matchBusca && matchPerfil;
    });
  }, [usuarios, busca, filtroPerfil]);

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

        <Card>
          <CardContent className="p-0">
            {usuariosFiltrados.length === 0 ? (
              <Empty className="py-12">
                <EmptyTitle>Nenhum usuário encontrado</EmptyTitle>
                <EmptyDescription>
                  Tente ajustar os filtros ou cadastre um novo usuário.
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          Exibindo {usuariosFiltrados.length} de {usuarios.length} usuários
        </div>
      </div>
    </DashboardLayout>
  );
}
