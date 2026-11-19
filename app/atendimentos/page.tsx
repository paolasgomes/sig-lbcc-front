"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Eye,
  Edit,
  Search,
  Trash2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import TableActions, {
  TableActionLink,
  TableActionButton,
} from "@/components/ui/table-actions";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { TableLoading } from "@/components/ui/table-state";
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";
import { useAreas } from "@/hooks/use-areas";
import { useAtendimentos } from "@/hooks/use-atendimentos";
import { useUsuario } from "@/hooks/use-usuario";
import {
  getTipoAtendimentoLabel,
  formatDataAtendimento,
} from "@/lib/atendimentos-utils";
import { TIPOS_ATENDIMENTO } from "@/types";

export default function AtendimentosPage() {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroArea, setFiltroArea] = useState<string>("todas");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    pacienteId: string;
  } | null>(null);

  const filtrosAtendimento = useMemo(
    () => ({
      areaId: filtroArea === "todas" ? undefined : filtroArea,
      periodoInicio: periodoInicio || undefined,
      periodoFim: periodoFim || undefined,
    }),
    [filtroArea, periodoInicio, periodoFim],
  );
  const { atendimentos, isLoading, error, refetch, excluirAtendimento, isDeleting } =
    useAtendimentos(filtrosAtendimento);
  const { areas, isLoading: areasLoading, error: areasError } = useAreas();
  const { isGestor } = useUsuario();

  const atendimentosFiltrados = useMemo(() => {
    const sorted = [...atendimentos].sort((a, b) =>
      b.dataAtendimento.localeCompare(a.dataAtendimento),
    );

    return sorted.filter((atendimento) => {
      const termo = busca.toLowerCase();
      const matchBusca =
        !termo ||
        (atendimento.pacienteNome?.toLowerCase().includes(termo) ?? false) ||
        atendimento.descricao.toLowerCase().includes(termo);

      const matchTipo =
        filtroTipo === "todos" || atendimento.tipo === filtroTipo;

      return matchBusca && matchTipo;
    });
  }, [atendimentos, busca, filtroTipo]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setActionError(null);
    try {
      await excluirAtendimento(deleteTarget);
      setDeleteTarget(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Erro ao excluir atendimento.",
      );
    }
  };

  return (
    <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Atendimentos</h1>
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

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar atendimentos</AlertTitle>
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
            <CardTitle>Lista de Atendimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-end justify-start gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por paciente ou descrição..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="h-10 w-full sm:w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {TIPOS_ATENDIMENTO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {getTipoAtendimentoLabel(tipo)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filtroArea}
                onValueChange={setFiltroArea}
                disabled={areasLoading || Boolean(areasError)}
              >
                <SelectTrigger className="h-10 w-full sm:w-56">
                  <SelectValue
                    placeholder={areasLoading ? "Carregando áreas..." : "Área"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as áreas</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid w-full grid-cols-2 gap-3 sm:w-[22rem]">
                <div className="flex min-w-0 flex-col gap-1">
                  <label
                    htmlFor="atendimento-periodo-inicio"
                    className="text-xs text-muted-foreground"
                  >
                    Data inicial
                  </label>
                  <Input
                    id="atendimento-periodo-inicio"
                    type="date"
                    value={periodoInicio}
                    max={periodoFim || undefined}
                    onChange={(event) => setPeriodoInicio(event.target.value)}
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <label
                    htmlFor="atendimento-periodo-fim"
                    className="text-xs text-muted-foreground"
                  >
                    Data final
                  </label>
                  <Input
                    id="atendimento-periodo-fim"
                    type="date"
                    value={periodoFim}
                    min={periodoInicio || undefined}
                    onChange={(event) => setPeriodoFim(event.target.value)}
                  />
                </div>
              </div>
            </div>

            {areasError && (
              <p className="mb-3 text-sm text-destructive">
                Erro ao carregar áreas: {areasError}
              </p>
            )}
            <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
              Quantidade de atendimentos encontrados:{" "}
              {isLoading ? "Carregando..." : atendimentosFiltrados.length}
            </p>

            {isLoading ? (
              <TableLoading message="Carregando atendimentos..." />
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atendimentosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Empty>
                            <EmptyTitle>Nenhum atendimento encontrado</EmptyTitle>
                            <EmptyDescription>
                              {busca ||
                              filtroTipo !== "todos" ||
                              filtroArea !== "todas" ||
                              periodoInicio ||
                              periodoFim
                                ? "Tente ajustar os filtros de busca."
                                : "Registre o primeiro atendimento para começar."}
                            </EmptyDescription>
                            {!busca &&
                              filtroTipo === "todos" &&
                              filtroArea === "todas" &&
                              !periodoInicio &&
                              !periodoFim && (
                                <Button asChild className="mt-4">
                                  <Link href="/atendimentos/novo">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Novo Atendimento
                                  </Link>
                                </Button>
                              )}
                          </Empty>
                        </TableCell>
                      </TableRow>
                    ) : (
                      atendimentosFiltrados.map((atendimento) => (
                        <TableRow key={atendimento.id}>
                          <TableCell>
                            {formatDataAtendimento(atendimento.dataAtendimento)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {atendimento.pacienteNome ?? "-"}
                          </TableCell>
                          <TableCell>
                            {getTipoAtendimentoLabel(atendimento.tipo)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {atendimento.descricao}
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate">
                            {atendimento.observacoes || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end">
                              <TableActions>
                                <TableActionLink href={`/atendimentos/${atendimento.id}`}>
                                  <span className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" /> Visualizar
                                  </span>
                                </TableActionLink>
                                <TableActionLink
                                  href={`/atendimentos/${atendimento.id}/editar`}
                                >
                                  <span className="flex items-center gap-2">
                                    <Edit className="h-4 w-4" /> Editar
                                  </span>
                                </TableActionLink>
                                {isGestor && (
                                  <TableActionButton
                                    variant="destructive"
                                    disabled={isDeleting}
                                    onSelect={() =>
                                      setDeleteTarget({
                                        id: atendimento.id,
                                        pacienteId: atendimento.pacienteId,
                                      })
                                    }
                                  >
                                    <span className="flex items-center gap-2">
                                      <Trash2 className="h-4 w-4" />
                                      Excluir
                                    </span>
                                  </TableActionButton>
                                )}
                              </TableActions>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir atendimento?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O registro será removido
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleDelete()}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
