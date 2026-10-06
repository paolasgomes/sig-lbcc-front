"use client";

import Link from "next/link";
import { Archive, Bell, Check, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { useArquivarNotificacao, useMarcarNotificacaoComoLida, useNotificacoes } from "@/hooks/use-notificacoes";
import { formatDateOnly } from "@/lib/prazo-utils";

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function NotificacoesPage() {
  const { notificacoes, isLoading, error } = useNotificacoes();
  const { marcarComoLida, isUpdating: marcandoComoLida } = useMarcarNotificacaoComoLida();
  const { arquivar, isUpdating: arquivando } = useArquivarNotificacao();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Central de notificações</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe alertas direcionados a você e mantenha o histórico sem excluir registros.
          </p>
        </div>

        {error && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Carregando notificações...
            </CardContent>
          </Card>
        ) : notificacoes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Empty
                title="Nenhuma notificação"
                description="Você não possui notificações ativas no momento."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notificacoes.map((notificacao) => {
              const ordemNumero = notificacao.dados.ordem?.numero ?? "Ordem de fornecimento";
              const paciente = notificacao.dados.paciente?.nome ?? "-";
              const fornecedor = notificacao.dados.fornecedor?.nome ?? "-";
              const cotacao = notificacao.dados.cotacao?.numero ?? "-";

              return (
                <Card key={notificacao.id} className={notificacao.lidaEm ? "" : "border-primary/40 bg-primary/5"}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2 text-primary">
                          <Bell className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{notificacao.titulo}</CardTitle>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatCreatedAt(notificacao.criadoEm)}
                          </p>
                        </div>
                      </div>
                      {!notificacao.lidaEm && <Badge>Não lida</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{notificacao.mensagem}</p>
                    <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div><p className="text-muted-foreground">Ordem</p><p className="font-medium">{ordemNumero}</p></div>
                      <div><p className="text-muted-foreground">Paciente</p><p className="font-medium">{paciente}</p></div>
                      <div><p className="text-muted-foreground">Fornecedor</p><p className="font-medium">{fornecedor}</p></div>
                      <div><p className="text-muted-foreground">Cotação</p><p className="font-medium">{cotacao}</p></div>
                      <div><p className="text-muted-foreground">Data limite</p><p className="font-medium">{formatDateOnly(notificacao.dataLimite)}</p></div>
                      <div><p className="text-muted-foreground">Status</p><p className="font-medium">Próxima à expiração</p></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {notificacao.link && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={notificacao.link}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir ordem
                          </Link>
                        </Button>
                      )}
                      {!notificacao.lidaEm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={marcandoComoLida}
                          onClick={() => void marcarComoLida(notificacao.id)}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Marcar como lida
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={arquivando}
                        onClick={() => void arquivar(notificacao.id)}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Arquivar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
