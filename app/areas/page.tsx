"use client";

import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAreas } from "@/hooks/use-areas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import TableActions, { TableActionButton } from "@/components/ui/table-actions";
import { TableLoading } from "@/components/ui/table-state";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  Loader2,
} from "lucide-react";
import type { AreaAtendimento } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";

export default function AreasPage() {
  const {
    areas,
    isLoading: areasLoading,
    error: areasError,
    refetch: refreshAreas,
    addArea,
    updateArea,
    deleteArea,
  } = useAreas();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaAtendimento | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ativa: true,
  });

  const filteredAreas = useMemo(() => {
    return areas.filter(
      (area) =>
        area.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.descricao.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [areas, searchTerm]);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const total = filteredAreas.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const displayedAreas = filteredAreas.slice(startIndex, startIndex + pageSize);

  const resetForm = () => {
    setEditingArea(null);
    setFormData({ nome: "", descricao: "", ativa: true });
  };

  const handleOpenDialog = (area?: AreaAtendimento) => {
    setSubmitError(null);
    setSubmitMessage(null);

    if (area) {
      setEditingArea(area);
      setFormData({
        nome: area.nome,
        descricao: area.descricao,
        ativa: area.ativa,
      });
    } else {
      setEditingArea(null);
      setFormData({ nome: "", descricao: "", ativa: true });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsSubmitting(false);
    resetForm();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      if (editingArea) {
        await updateArea(editingArea.id, formData);
        setSubmitMessage("Área atualizada com sucesso.");
      } else {
        await addArea(formData);
        setSubmitMessage("Área cadastrada com sucesso.");
      }

      handleCloseDialog();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Erro ao salvar área.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta área?")) {
      setSubmitError(null);
      setSubmitMessage(null);

      try {
        await deleteArea(id);
        setSubmitMessage("Área excluída com sucesso.");
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Erro ao excluir área.");
      }
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor", "atendente"]}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Areas de Atendimento</h1>
              <p className="text-muted-foreground">
                Gerencie as areas de servico oferecidas pela Liga
              </p>
            </div>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                if (open) {
                  setIsDialogOpen(true);
                  return;
                }

                handleCloseDialog();
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Area
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingArea ? "Editar Area" : "Nova Area de Atendimento"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingArea
                      ? "Atualize as informacoes da area de atendimento"
                      : "Cadastre uma nova area de atendimento"}
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <FieldLabel>Nome da Area</FieldLabel>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Oncologia, Radioterapia..."
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Descricao</FieldLabel>
                    <Textarea
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Descreva os servicos oferecidos nesta area..."
                      rows={3}
                    />
                  </Field>
                  <Field className="flex flex-row items-center gap-2">
                    <input
                      type="checkbox"
                      id="ativa"
                      checked={formData.ativa}
                      onChange={(e) =>
                        setFormData({ ...formData, ativa: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-border"
                    />
                    <FieldLabel htmlFor="ativa" className="mb-0">
                      Area ativa
                    </FieldLabel>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => void handleSubmit()}
                    disabled={!formData.nome || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : editingArea ? (
                      "Salvar"
                    ) : (
                      "Cadastrar"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {areasError && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar as áreas</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{areasError}</span>
                <Button variant="outline" onClick={() => void refreshAreas()}>
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {submitError ? (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível salvar a área</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : submitMessage ? (
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              {submitMessage}
            </p>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Areas Cadastradas
              </CardTitle>
              <CardDescription>{areas.length} area(s) cadastrada(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar areas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                {areasLoading ? (
                  <TableLoading message="Carregando áreas..." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-17.5">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedAreas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            Nenhuma area encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedAreas.map((area) => (
                          <TableRow key={area.id}>
                            <TableCell className="font-medium">{area.nome}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {area.descricao}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={area.ativa ? "ativo" : "inativo"} />
                            </TableCell>
                            <TableCell>
                              <TableActions>
                                <TableActionButton
                                  onSelect={() => handleOpenDialog(area)}
                                >
                                  <span className="flex items-center gap-2">
                                    <Pencil className="h-4 w-4" /> Editar
                                  </span>
                                </TableActionButton>
                                <TableActionButton
                                  variant="destructive"
                                  onSelect={() => void handleDelete(area.id)}
                                >
                                  <span className="flex items-center gap-2">
                                    <Trash2 className="h-4 w-4" /> Excluir
                                  </span>
                                </TableActionButton>
                              </TableActions>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
              {!areasLoading && !areasError && (
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm text-muted-foreground">
                    Exibindo {displayedAreas.length} de {filteredAreas.length} áreas
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
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
