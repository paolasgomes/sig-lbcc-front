"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Eye, Edit, Filter, AlertCircle } from "lucide-react";
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
import PageHeader from "@/components/layout/page-header";
import TableActions, {
  TableActionButton,
  TableActionLink,
} from "@/components/ui/table-actions";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Empty } from "@/components/ui/empty";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { TableLoading } from "@/components/ui/table-state";
import { usePacientes } from "@/hooks/use-pacientes";
import { StatusPaciente, type Paciente } from "@/types";
import { ExcluirPaciente } from "@/components/pacientes/excluir-paciente";

export default function PacientesPage() {
  const {
    pacientes,
    isLoading: pacientesLoading,
    error: pacientesError,
    refetch: refreshPacientes,
  } = usePacientes();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [pacienteParaExcluir, setPacienteParaExcluir] = useState<Paciente | null>(null);

  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter((paciente) => {
      const matchBusca =
        paciente.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
        paciente.cpf?.includes(busca);

      const matchStatus = filtroStatus === "todos" || paciente.status === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [pacientes, busca, filtroStatus]);

  const temFiltroAtivo = busca.trim().length > 0 || filtroStatus !== "todos";

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const total = pacientesFiltrados.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedPacientes = pacientesFiltrados.slice(startIndex, endIndex);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const handleExcluir = (paciente: Paciente) => {
    setPacienteParaExcluir(paciente);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Pacientes"
          description="Gerencie os pacientes cadastrados no sistema"
          actions={
            <Button asChild>
              <Link href="/pacientes/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Paciente
              </Link>
            </Button>
          }
        />

        {pacientesError && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível carregar os pacientes</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{pacientesError}</span>
              <Button variant="outline" onClick={() => void refreshPacientes()}>
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
            {pacientesLoading ? (
              <TableLoading message="Carregando pacientes..." />
            ) : pacientesFiltrados.length === 0 ? (
              <Empty
                title={
                  temFiltroAtivo
                    ? "Nenhum paciente encontrado"
                    : "Nenhum paciente cadastrado"
                }
                description={
                  temFiltroAtivo
                    ? "Tente ajustar os filtros ou limpar a busca para ver todos os pacientes."
                    : "Cadastre o primeiro paciente para iniciar o gerenciamento."
                }
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
                  {displayedPacientes.map((paciente) => (
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
                        <div className="flex items-center justify-end">
                          <TableActions>
                            <TableActionLink href={`/pacientes/${paciente.id}`}>
                              <span className="flex items-center gap-2">
                                <Eye className="h-4 w-4" /> Visualizar
                              </span>
                            </TableActionLink>
                            <TableActionLink href={`/pacientes/${paciente.id}/editar`}>
                              <span className="flex items-center gap-2">
                                <Edit className="h-4 w-4" /> Editar
                              </span>
                            </TableActionLink>
                            <TableActionButton
                              variant="destructive"
                              onSelect={() => handleExcluir(paciente)}
                            >
                              <span className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> Excluir
                              </span>
                            </TableActionButton>
                          </TableActions>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {pacienteParaExcluir && (
          <ExcluirPaciente
            pacienteId={pacienteParaExcluir.id}
            pacienteNome={pacienteParaExcluir.nomeCompleto}
            open={Boolean(pacienteParaExcluir)}
            onOpenChange={(open) => {
              if (!open) {
                setPacienteParaExcluir(null);
              }
            }}
          />
        )}

        {!pacientesLoading && !pacientesError && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Exibindo {displayedPacientes.length} de {pacientesFiltrados.length}{" "}
              pacientes
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
