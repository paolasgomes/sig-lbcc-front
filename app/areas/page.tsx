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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, MapPin } from "lucide-react";
import type { AreaAtendimento } from "@/types";

export default function AreasPage() {
  const { areas, addArea, updateArea, deleteArea } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaAtendimento | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ativa: true,
  });

  const filteredAreas = areas.filter(
    (area) =>
      area.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.descricao.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenDialog = (area?: AreaAtendimento) => {
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

  const handleSubmit = () => {
    if (editingArea) {
      updateArea(editingArea.id, formData);
    } else {
      addArea(formData);
    }
    setIsDialogOpen(false);
    setEditingArea(null);
    setFormData({ nome: "", descricao: "", ativa: true });
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta area?")) {
      deleteArea(id);
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  <Field className="flex items-center gap-2">
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
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={!formData.nome}>
                    {editingArea ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

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
                    {filteredAreas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Nenhuma area encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAreas.map((area) => (
                        <TableRow key={area.id}>
                          <TableCell className="font-medium">{area.nome}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {area.descricao}
                          </TableCell>
                          <TableCell>
                            <Badge variant={area.ativa ? "default" : "secondary"}>
                              {area.ativa ? "Ativa" : "Inativa"}
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
                                <DropdownMenuItem onClick={() => handleOpenDialog(area)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(area.id)}
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
