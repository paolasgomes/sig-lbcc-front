"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useDecidirCancelamento, useDivergencias, useSolicitacoesCancelamento } from "@/hooks/use-divergencias";

function mensagemErro(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { erro?: string } } }).response;
    return response?.data?.erro || "Não foi possível concluir a operação.";
  }
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

export default function DivergenciasPage() {
  const { usuario } = useAuth();
  const [status, setStatus] = useState("");
  const [ordemTipo, setOrdemTipo] = useState("");
  const { divergencias, isLoading, error, refetch } = useDivergencias({ status: status || undefined, tipo_ordem: (ordemTipo || undefined) as "OF" | "OT" | undefined });
  const { solicitacoes, isLoading: carregandoCancelamentos, error: erroCancelamentos, refetch: recarregarCancelamentos } = useSolicitacoesCancelamento();
  const { mutate: decidir, isPending } = useDecidirCancelamento();
  const ehGestor = usuario?.perfil === "gestor";

  async function decidirCancelamento(id: string, aprovado: boolean) {
    const justificativa = window.prompt(aprovado ? "Justificativa para aprovar o cancelamento:" : "Justificativa para recusar o cancelamento:");
    if (!justificativa?.trim()) return;
    try {
      await decidir(id, { aprovado, justificativa: justificativa.trim() });
    } catch (error) {
      window.alert(mensagemErro(error));
    }
  }

  return <DashboardLayout><div className="space-y-6">
    <div><h1 className="text-2xl font-semibold">Divergências de OF e OT</h1><p className="text-sm text-muted-foreground">Fila de RF_F13, histórico de tratamento e encaminhamentos de cancelamento RF_F14.</p></div>

    <Card><CardHeader><CardTitle>Fila de divergências</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="flex flex-wrap gap-3"><select aria-label="Filtrar por situação" className="h-10 rounded-md border bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todas as situações</option><option value="aberta">Aberta</option><option value="em_tratamento">Em tratamento</option><option value="resolvida">Resolvida</option><option value="encerrada_sem_solucao">Encerrada sem solução</option></select><select aria-label="Filtrar por tipo de ordem" className="h-10 rounded-md border bg-background px-3 text-sm" value={ordemTipo} onChange={(event) => setOrdemTipo(event.target.value)}><option value="">OF e OT</option><option value="OF">Ordem de Fornecimento</option><option value="OT">Ordem de Transporte</option></select><Button type="button" variant="outline" onClick={() => void refetch()}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button></div>
      {error ? <Alert variant="destructive"><AlertDescription>Não foi possível carregar a fila de divergências. <Button variant="link" onClick={() => void refetch()}>Tentar novamente</Button></AlertDescription></Alert> : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando divergências…</p> : null}
      {!isLoading && divergencias.length === 0 ? <p className="py-5 text-center text-sm text-muted-foreground">Nenhuma divergência encontrada.</p> : null}
      <div className="space-y-2">{divergencias.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4"><div className="flex min-w-0 items-start gap-3"><AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-600" /><div><p className="font-medium">{item.descricao}</p><p className="text-xs text-muted-foreground">{item.ordem_fornecimento_id ? "OF" : "OT"} · {item.ordem_fornecimento_id || item.ordem_transporte_id} · {new Date(item.identificado_em).toLocaleString("pt-BR")}</p></div></div><div className="flex flex-wrap items-center gap-2"><Badge variant={item.impeditiva ? "destructive" : "secondary"}>{item.impeditiva ? "Impeditiva" : "Não impeditiva"}</Badge><Badge>{item.status.replaceAll("_", " ")}</Badge><Button asChild size="sm" variant="outline"><Link href={`/divergencias/${item.id}`}>Abrir</Link></Button></div></div>)}</div>
    </CardContent></Card>

    <Card><CardHeader><CardTitle>Solicitações de cancelamento RF_F14</CardTitle><p className="text-sm text-muted-foreground">A decisão não é automática. A ordem só é cancelada após aprovação do gestor.</p></CardHeader><CardContent className="space-y-3">
      {erroCancelamentos ? <Alert variant="destructive"><AlertDescription>Não foi possível carregar as solicitações. <Button variant="link" onClick={() => void recarregarCancelamentos()}>Tentar novamente</Button></AlertDescription></Alert> : null}
      {carregandoCancelamentos ? <p className="text-sm text-muted-foreground">Carregando solicitações…</p> : null}
      {!carregandoCancelamentos && solicitacoes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma solicitação registrada.</p> : null}
      {solicitacoes.map((pedido) => <div key={pedido.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4"><div><p className="font-medium">{pedido.ordem_fornecimento_id ? "OF" : "OT"} · {pedido.ordem_fornecimento_id || pedido.ordem_transporte_id}</p><p className="text-sm">{pedido.motivo}</p><p className="text-xs text-muted-foreground">Solicitada em {new Date(pedido.solicitado_em).toLocaleString("pt-BR")} · Divergência {pedido.divergencia_id}</p>{pedido.justificativa_decisao ? <p className="mt-1 text-xs text-muted-foreground">Decisão: {pedido.justificativa_decisao}</p> : null}</div><div className="flex items-center gap-2"><Badge variant={pedido.status === "solicitada" ? "secondary" : pedido.status === "aprovada" ? "default" : "destructive"}>{pedido.status}</Badge>{ehGestor && pedido.status === "solicitada" ? <><Button size="sm" disabled={isPending} onClick={() => void decidirCancelamento(pedido.id, true)}>Aprovar</Button><Button size="sm" variant="outline" disabled={isPending} onClick={() => void decidirCancelamento(pedido.id, false)}>Recusar</Button></> : null}<Button asChild size="sm" variant="outline"><Link href={`/divergencias/${pedido.divergencia_id}`}>Ver caso</Link></Button></div></div>)}
    </CardContent></Card>
  </div></DashboardLayout>;
}
