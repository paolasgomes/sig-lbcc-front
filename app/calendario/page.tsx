"use client";

import { useState } from "react";
import { CalendarDays, Pencil, Power, Plus, Save, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PerfilUsuario } from "@/types";
import { useCalendario } from "@/hooks/use-calendario";
import { formatDateOnly } from "@/lib/prazo-utils";

function formatDateForInput(value: string | null | undefined) {
  const match = value?.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

export default function CalendarioPage() {
  const { feriados, isLoading, error, refetch, criar, editar, alternar } = useCalendario();
  const [data, setData] = useState("");
  const [nome, setNome] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  function limparFormulario() {
    setData("");
    setNome("");
    setEditandoId(null);
  }

  function iniciarEdicao(feriado: (typeof feriados)[number]) {
    setEditandoId(feriado.id);
    setData(formatDateForInput(feriado.data));
    setNome(feriado.nome);
    setMensagem(null);
  }

  async function salvar() {
    setMensagem(null);
    try {
      if (editandoId) {
        await editar.mutateAsync({ id: editandoId, data, nome });
        setMensagem("Feriado atualizado.");
      } else {
        await criar.mutateAsync({ data, nome });
        setMensagem("Feriado cadastrado.");
      }
      limparFormulario();
    } catch (mutationError) {
      setMensagem(mutationError instanceof Error ? mutationError.message : "Nao foi possivel salvar o feriado.");
    }
  }

  async function alternarStatus(id: string, ativo: boolean) {
    setMensagem(null);
    try {
      await alternar.mutateAsync({ id, ativo: !ativo });
      setMensagem(ativo ? "Feriado inativado." : "Feriado ativado.");
    } catch (mutationError) {
      setMensagem(mutationError instanceof Error ? mutationError.message : "Nao foi possivel alterar o feriado.");
    }
  }

  return (
    <DashboardLayout perfisPermitidos={[PerfilUsuario.GESTOR]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Calendário útil</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os feriados usados no cálculo dos prazos das ordens.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editandoId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editandoId ? "Editar feriado" : "Cadastrar feriado"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">Data</label>
              <Input type="date" value={data} onChange={(event) => setData(event.target.value)} />
            </div>
            <div className="flex-[2]">
              <label className="mb-2 block text-sm font-medium">Nome do feriado</label>
              <Input value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Proclamação da República" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void salvar()} disabled={!data || !nome.trim() || criar.isPending || editar.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
              {editandoId && (
                <Button variant="outline" onClick={limparFormulario}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {(error || mensagem) && (
          <Card>
            <CardContent className="pt-6">
              <p className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
                {error ?? mensagem}
              </p>
              {error && <Button variant="outline" className="mt-3" onClick={() => void refetch()}>Tentar novamente</Button>}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Feriados cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Feriado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center">Carregando calendário...</TableCell></TableRow>
                ) : feriados.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Nenhum feriado cadastrado.</TableCell></TableRow>
                ) : feriados.map((feriado) => (
                  <TableRow
                    key={feriado.id}
                    className={feriado.ativo ? undefined : "bg-muted/40 text-muted-foreground"}
                  >
                    <TableCell>{formatDateOnly(feriado.data)}</TableCell>
                    <TableCell className="font-medium">{feriado.nome}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={feriado.ativo
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                          : "border-muted-foreground/30 bg-muted text-muted-foreground"}
                      >
                        {feriado.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="Editar feriado" onClick={() => iniciarEdicao(feriado)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={feriado.ativo ? "ghost" : "outline"}
                        size="sm"
                        title={feriado.ativo ? "Inativar feriado" : "Ativar feriado"}
                        aria-label={feriado.ativo ? "Inativar feriado" : "Ativar feriado"}
                        disabled={alternar.isPending}
                        onClick={() => void alternarStatus(feriado.id, feriado.ativo)}
                      >
                        <Power className="h-4 w-4" />
                        {feriado.ativo ? "Inativar" : "Ativar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
