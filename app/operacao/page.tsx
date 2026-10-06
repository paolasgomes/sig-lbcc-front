"use client";

import { Activity, Play, RefreshCw } from "lucide-react";
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PerfilUsuario } from "@/types";
import { useOperacaoAutomacao } from "@/hooks/use-operacao";

const jobLabels = {
  proximidade: "Proximidade",
  atraso: "Atraso",
  lembretes_fornecedor: "Lembretes ao fornecedor",
} as const;

const statusLabels = {
  executando: "Executando",
  concluida: "Concluída",
  concluida_com_falhas: "Concluída com falhas",
  falha: "Falha",
  ignorada: "Ignorada",
} as const;

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function OperacaoPage() {
  const { execucoes, pendencias, error, processar, isProcessing, refetch } = useOperacaoAutomacao();
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function processarAgora() {
    setMensagem(null);
    try {
      const resultado = await processar(undefined);
      setMensagem(
        `${resultado.resumo.ordensAfetadas} ordem(ns) afetada(s), ${resultado.resumo.notificacoesCriadas} notificação(ões) e ${resultado.resumo.emailsEnviados} e-mail(s) enviado(s).`,
      );
    } catch {
      // O erro da mutation já está disponível no painel.
    }
  }

  return (
    <DashboardLayout perfisPermitidos={[PerfilUsuario.GESTOR]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Operação da automação</h1>
            <p className="text-sm text-muted-foreground">
              Reprocesse prazos existentes e acompanhe falhas, retentativas e pendências.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button onClick={() => void processarAgora()} disabled={isProcessing}>
              <Play className="mr-2 h-4 w-4" />
              {isProcessing ? "Processando..." : "Processar agora"}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {mensagem && <p className="text-sm text-green-700">{mensagem}</p>}

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader><CardTitle className="text-sm">Execuções recentes</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{execucoes.length}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Pendências ativas</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{pendencias.length}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Falhas registradas</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{execucoes.reduce((total, item) => total + item.falhas, 0)}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Retentativas</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{execucoes.reduce((total, item) => total + item.retentativas, 0)}</CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Histórico de execuções</CardTitle></CardHeader>
          <CardContent>
            {execucoes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma execução registrada.</p> : (
              <div className="space-y-3">
                {execucoes.slice(0, 20).map((execucao) => (
                  <div key={execucao.id} className="flex flex-col gap-2 border-b pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{jobLabels[execucao.job_nome]} · {execucao.origem === "manual" ? "Manual" : "Automática"}</p>
                      <p className="text-xs text-muted-foreground">Início: {formatDateTime(execucao.iniciado_em)} · Ordens afetadas: {execucao.ordens_afetadas} · Notificações: {execucao.notificacoes_criadas} · E-mails: {execucao.emails_enviados}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{execucao.falhas} falha(s) · {execucao.retentativas} retentativa(s)</span>
                      <Badge variant={execucao.status === "concluida" ? "outline" : "destructive"}>{statusLabels[execucao.status]}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pendências administrativas</CardTitle></CardHeader>
          <CardContent>
            {pendencias.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma pendência ativa.</p> : (
              <div className="space-y-3">
                {pendencias.slice(0, 20).map((pendencia) => (
                  <div key={pendencia.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <p className="font-medium">{pendencia.tipo}</p>
                    <p className="text-sm text-muted-foreground">{pendencia.descricao}</p>
                    <p className="text-xs text-muted-foreground">Ocorrências: {pendencia.ocorrencias} · Última: {formatDateTime(pendencia.ultima_ocorrencia_em)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
