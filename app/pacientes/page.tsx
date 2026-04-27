"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Eye, Edit, Filter } from "lucide-react";
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
import { StatusBadge } from "@/components/shared/status-badge";
import { Empty } from "@/components/ui/empty";
import { useData } from "@/contexts/data-context";
import { StatusPaciente } from "@/types";

export default function PacientesPage() {
  const { pacientes } = useData();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter((paciente) => {
      const matchBusca =
        paciente.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
        paciente.cpf.includes(busca);

      const matchStatus = filtroStatus === "todos" || paciente.status === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [pacientes, busca, filtroStatus]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
            <p className="text-muted-foreground">
              Gerencie os pacientes cadastrados no sistema
            </p>
          </div>
          <Button asChild>
            <Link href="/pacientes/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
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
                  placeholder="Buscar por nome ou CPF..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value={StatusPaciente.ATIVO}>Ativo</SelectItem>
                  <SelectItem value={StatusPaciente.SUSPENSO}>Suspenso</SelectItem>
                  <SelectItem value={StatusPaciente.ENCERRADO}>Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {pacientesFiltrados.length === 0 ? (
              <Empty
                title="Nenhum paciente encontrado"
                description="Tente ajustar os filtros ou cadastre um novo paciente."
                className="py-12"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Diagnóstico</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pacientesFiltrados.map((paciente) => (
                    <TableRow key={paciente.id}>
                      <TableCell className="font-medium">
                        {paciente.nomeCompleto}
                      </TableCell>
                      <TableCell>{paciente.cpf}</TableCell>
                      <TableCell className="max-w-50 truncate">
                        {paciente.diagnosticoOncologico}
                      </TableCell>
                      <TableCell>{paciente.areaTratamento}</TableCell>
                      <TableCell>
                        <StatusBadge status={paciente.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/pacientes/${paciente.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Visualizar</span>
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/pacientes/${paciente.id}/editar`}>
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
          Exibindo {pacientesFiltrados.length} de {pacientes.length} pacientes
        </div>
      </div>
    </DashboardLayout>
  );
}
