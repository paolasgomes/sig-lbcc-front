"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Building2,
} from "lucide-react";
import Link from "next/link";

export default function FornecedoresPage() {
  const { fornecedores, deleteFornecedor } = useData();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFornecedores = fornecedores.filter(
    (fornecedor) =>
      (fornecedor.nomeFantasia ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fornecedor.razaoSocial ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fornecedor.cnpj ?? "").includes(searchTerm),
  );

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
      deleteFornecedor(id);
    }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return phone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }
    return phone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor"]}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Fornecedores</h1>
              <p className="text-muted-foreground">
                Gerencie os fornecedores de produtos e servicos
              </p>
            </div>
            <Button asChild>
              <Link href="/fornecedores/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Fornecedores Cadastrados
              </CardTitle>
              <CardDescription>
                {fornecedores.length} fornecedor(es) cadastrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome Fantasia</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cidade/UF</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-17.5">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFornecedores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Nenhum fornecedor encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFornecedores.map((fornecedor) => (
                        <TableRow key={fornecedor.id}>
                          <TableCell className="font-medium">
                            {fornecedor.nomeFantasia}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatCNPJ(fornecedor.cnpj ?? "")}
                          </TableCell>
                          <TableCell>{formatPhone(fornecedor.telefone)}</TableCell>
                          <TableCell>
                            {fornecedor.cidade}/{fornecedor.uf}
                          </TableCell>
                          <TableCell>
                            <Badge variant={fornecedor.ativo ? "default" : "secondary"}>
                              {fornecedor.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Acoes</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/fornecedores/${fornecedor.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/fornecedores/${fornecedor.id}/editar`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(fornecedor.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
