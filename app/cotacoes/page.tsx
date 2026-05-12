"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useCotacoes } from "@/hooks/use-cotacoes";
import { usePacientes } from "@/hooks/use-pacientes";
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
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus, Search, MoreHorizontal, Eye, Pencil, FileText } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CotacoesPage() {
  const { cotacoes } = useCotacoes();
  const { pacientes } = usePacientes();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const calcularValorTotal = (
    itens: Array<{ quantidade: number; valorUnitario: number }>,
  ) => {
    return itens.reduce((total, item) => total + item.quantidade * item.valorUnitario, 0);
  };

  const filteredCotacoes = cotacoes.filter((cotacao) => {
    const paciente = pacientes.find((p) => p.id === cotacao.pacienteId);
    const matchesSearch =
      (paciente?.nomeCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false) ||
      cotacao.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || cotacao.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPacienteNome = (pacienteId: string) => {
    const paciente = pacientes.find((p) => p.id === pacienteId);
    return paciente?.nomeCompleto || "Paciente nao encontrado";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendente: "Pendente",
      valida: "Valida",
      expirada: "Expirada",
    };
    return labels[status] || status;
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor", "atendente"]}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Cotacoes</h1>
              <p className="text-muted-foreground">
                Gerencie as cotacoes de produtos e servicos
              </p>
            </div>
            <Button asChild>
              <Link href="/cotacoes/nova">
                <Plus className="mr-2 h-4 w-4" />
                Nova Cotacao
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lista de Cotacoes
              </CardTitle>
              <CardDescription>
                {cotacoes.length} cotacao(oes) cadastrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por paciente ou numero..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-9 w-full sm:w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="todos">Todos os status</option>
                  <option value="pendente">Pendente</option>
                  <option value="valida">Valida</option>
                  <option value="expirada">Expirada</option>
                </select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCotacoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nenhuma cotacao encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCotacoes.map((cotacao) => (
                        <TableRow key={cotacao.id}>
                          <TableCell className="font-mono text-sm">
                            {cotacao.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {getPacienteNome(cotacao.pacienteId)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(cotacao.dataSolicitacao), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell>{cotacao.itens.length} item(ns)</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(calcularValorTotal(cotacao.itens))}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={cotacao.status} type="cotacao" />
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
                                  <Link href={`/cotacoes/${cotacao.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizar
                                  </Link>
                                </DropdownMenuItem>
                                {cotacao.status === "pendente" && (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/cotacoes/${cotacao.id}/editar`}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Editar
                                    </Link>
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
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
