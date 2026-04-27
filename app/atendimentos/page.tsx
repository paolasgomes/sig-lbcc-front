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
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus, Search, MoreHorizontal, Eye, Pencil, ClipboardList } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AtendimentosPage() {
  const { atendimentos, pacientes, areas } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [areaFilter, setAreaFilter] = useState<string>("todas");

  const filteredAtendimentos = atendimentos.filter((atendimento) => {
    const paciente = pacientes.find((p) => p.id === atendimento.pacienteId);
    const matchesSearch =
      paciente?.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atendimento.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "todos" || atendimento.areaAtendimentoId === statusFilter;
    const matchesArea =
      areaFilter === "todas" || atendimento.areaAtendimentoId === areaFilter;
    return matchesSearch && matchesStatus && matchesArea;
  });

  const getPacienteNome = (pacienteId: string) => {
    const paciente = pacientes.find((p) => p.id === pacienteId);
    return paciente?.nomeCompleto || "Paciente nao encontrado";
  };

  const getAreaNome = (areaId: string) => {
    const area = areas.find((a) => a.id === areaId);
    return area?.nome || "Area nao encontrada";
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
  };

  return (
    <ProtectedRoute perfisPermitidos={["operador", "gestor", "prefeitura"]}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Atendimentos</h1>
              <p className="text-muted-foreground">
                Registre e acompanhe os atendimentos realizados
              </p>
            </div>
            <Button asChild>
              <Link href="/atendimentos/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Atendimento
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Lista de Atendimentos
              </CardTitle>
              <CardDescription>
                {atendimentos.length} atendimento(s) registrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="flex h-9 w-full sm:w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="todas">Todas as areas</option>
                  {areas
                    .filter((a) => a.ativa)
                    .map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.nome}
                      </option>
                    ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-9 w-full sm:w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="todos">Todos os status</option>
                  <option value="agendado">Agendado</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAtendimentos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Nenhum atendimento encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAtendimentos.map((atendimento) => (
                        <TableRow key={atendimento.id}>
                          <TableCell className="font-medium">
                            {getPacienteNome(atendimento.pacienteId)}
                          </TableCell>
                          <TableCell>{getAreaNome(atendimento.areaId)}</TableCell>
                          <TableCell className="text-sm">
                            {formatDateTime(atendimento.dataHora)}
                          </TableCell>
                          <TableCell className="capitalize">{atendimento.tipo}</TableCell>
                          <TableCell>
                            <StatusBadge status={atendimento.status} type="atendimento" />
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
                                  <Link href={`/atendimentos/${atendimento.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizar
                                  </Link>
                                </DropdownMenuItem>
                                {atendimento.status !== "concluido" &&
                                  atendimento.status !== "cancelado" && (
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/atendimentos/${atendimento.id}/editar`}
                                      >
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
