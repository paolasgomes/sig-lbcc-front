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
import { useDivergencias } from "@/hooks/use-divergencias";
import {
  useDecidirCancelamento,
  useListarCancelamentosDiretos,
} from "@/hooks/use-cancelamento";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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
  const [statusCancelamento, setStatusCancelamento] = useState("");
  const [tipoCancelamento, setTipoCancelamento] = useState("");
  const [buscaCancelamento, setBuscaCancelamento] = useState("");
  const { divergencias, isLoading, error, refetch } = useDivergencias({ status: status || undefined, tipo_ordem: (ordemTipo || undefined) as "OF" | "OT" | undefined });
  const { solicitacoes, isLoading: carregandoCancelamentos, error: erroCancelamentos, refetch: recarregarCancelamentos } = useListarCancelamentosDiretos();
  const { decidir, isDeciding: isPending } = useDecidirCancelamento();
  const solicitacoesFiltradas = solicitacoes.filter((pedido) => {
  const correspondeStatus =
    !statusCancelamento || pedido.status === statusCancelamento;

  const tipoPedido = pedido.ordem_fornecimento_id ? "OF" : "OT";
  const correspondeTipo =
    !tipoCancelamento || tipoPedido === tipoCancelamento;

  const termo = buscaCancelamento.trim().toLowerCase();

  const correspondeBusca =
    !termo ||
    (pedido.ordem_fornecimento_id || "").toLowerCase().includes(termo) ||
    (pedido.ordem_transporte_id || "").toLowerCase().includes(termo) ||
    (pedido.motivo || "").toLowerCase().includes(termo) ||
    (pedido.justificativa_decisao || "").toLowerCase().includes(termo);

    return correspondeStatus && correspondeTipo && correspondeBusca;
  });
  const ehGestor = usuario?.perfil === "gestor";
  const [solicitacaoRecusando, setSolicitacaoRecusando] = useState<string | null>(null);
  const [justificativaRecusa, setJustificativaRecusa] = useState("");
  const [solicitacaoAprovando, setSolicitacaoAprovando] = useState<string | null>(null);
  const [gerarRecotacao, setGerarRecotacao] = useState(false);
  const [dataValidadeRecotacao, setDataValidadeRecotacao] = useState("");

  async function decidirCancelamento(
    id: string,
    aprovado: boolean,
    gerarRecotacaoOpcao = false,
  ) {
    const justificativa = aprovado
      ? "Cancelamento aprovado."
      : justificativaRecusa.trim();

    if (!justificativa) return;

    try {
      await decidir({
        solicitacaoId: id,
        dados: {
          aprovado,
          justificativa,
          gerar_recotacao: aprovado && gerarRecotacaoOpcao,
          ...(aprovado && gerarRecotacaoOpcao && dataValidadeRecotacao
            ? { data_validade_recotacao: dataValidadeRecotacao }
            : {}),
        },
      });

      setSolicitacaoRecusando(null);
      setJustificativaRecusa("");
      setSolicitacaoAprovando(null);
      setGerarRecotacao(false);
      setDataValidadeRecotacao("");
    } catch (error) {
      window.alert(mensagemErro(error));
    }
  }

    return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Divergências e Cancelamentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhamento de divergências e solicitações de cancelamento de OF e OT.
          </p>
        </div>

        <Tabs defaultValue="divergencias" className="space-y-6">
          <TabsList>
            <TabsTrigger value="divergencias">
              Divergências
            </TabsTrigger>
            <TabsTrigger value="cancelamentos">
              Cancelamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="divergencias">
            <Card>
              <CardHeader>
                <CardTitle>Fila de divergências</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <select
                    aria-label="Filtrar por situação"
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="">Todas as situações</option>
                    <option value="aberta">Aberta</option>
                    <option value="em_tratamento">Em tratamento</option>
                    <option value="resolvida">Resolvida</option>
                    <option value="encerrada_sem_solucao">Encerrada sem solução</option>
                  </select>

                  <select
                    aria-label="Filtrar por tipo de ordem"
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={ordemTipo}
                    onChange={(event) => setOrdemTipo(event.target.value)}
                  >
                    <option value="">OF e OT</option>
                    <option value="OF">Ordem de Fornecimento</option>
                    <option value="OT">Ordem de Transporte</option>
                  </select>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void refetch()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>
                </div>

                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Não foi possível carregar a fila de divergências.{" "}
                      <Button variant="link" onClick={() => void refetch()}>
                        Tentar novamente
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : null}

                {isLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Carregando divergências…
                  </p>
                ) : null}

                {!isLoading && divergencias.length === 0 ? (
                  <p className="py-5 text-center text-sm text-muted-foreground">
                    Nenhuma divergência encontrada.
                  </p>
                ) : null}

                <div className="space-y-2">
                  {divergencias.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-600" />
                        <div>
                          <p className="font-medium">{item.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.ordem_fornecimento_id ? "OF" : "OT"} ·{" "}
                            {item.ordem_fornecimento_id || item.ordem_transporte_id} ·{" "}
                            {new Date(item.identificado_em).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.impeditiva ? "destructive" : "secondary"}>
                          {item.impeditiva ? "Impeditiva" : "Não impeditiva"}
                        </Badge>
                        <Badge>{item.status.replaceAll("_", " ")}</Badge>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/divergencias/${item.id}`}>Abrir</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelamentos">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de cancelamento</CardTitle>
                <p className="text-sm text-muted-foreground">
                  A decisão não é automática. A ordem só é cancelada após aprovação do gestor.
                </p>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[160px] flex-1 space-y-1">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={statusCancelamento}
                  onChange={(e) => setStatusCancelamento(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="solicitada">Solicitadas</option>
                  <option value="aprovada">Aprovadas</option>
                  <option value="recusada">Recusadas</option>
                </select>
              </div>

              <div className="min-w-[160px] flex-1 space-y-1">
                <label className="text-sm font-medium">Tipo de ordem</label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={tipoCancelamento}
                  onChange={(e) => setTipoCancelamento(e.target.value)}
                >
                  <option value="">Todas as ordens</option>
                  <option value="OF">Ordem de Fornecimento</option>
                  <option value="OT">Ordem de Transporte</option>
                </select>
              </div>

              <div className="min-w-[200px] flex-[2] space-y-1">
                <label className="text-sm font-medium">Buscar</label>
                <input
                  type="text"
                  placeholder="Número da ordem ou motivo..."
                  value={buscaCancelamento}
                  onChange={(e) => setBuscaCancelamento(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStatusCancelamento("");
                  setTipoCancelamento("");
                  setBuscaCancelamento("");
                }}
              >
                Limpar filtros
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => void recarregarCancelamentos()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
            </div>

            <p className="pt-2 text-sm text-muted-foreground">
              Exibindo {solicitacoesFiltradas.length} de {solicitacoes.length} solicitação(ões).
            </p>
                {erroCancelamentos ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Não foi possível carregar as solicitações.{" "}
                      <Button
                        variant="link"
                        onClick={() => void recarregarCancelamentos()}
                      >
                        Tentar novamente
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : null}

                {carregandoCancelamentos ? (
                  <p className="text-sm text-muted-foreground">
                    Carregando solicitações…
                  </p>
                ) : null}

                {!erroCancelamentos && !carregandoCancelamentos && solicitacoes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma solicitação registrada.
                  </p>
                ) : null}
                {!carregandoCancelamentos &&
                  !erroCancelamentos &&
                  solicitacoes.length > 0 &&
                  solicitacoesFiltradas.length === 0 && (
                    <p className="py-5 text-center text-sm text-muted-foreground">
                      Nenhuma solicitação corresponde aos filtros selecionados.
                    </p>
                  )}
                {solicitacoesFiltradas.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="flex flex-col gap-3 rounded-md border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {pedido.ordem_fornecimento_id ? "OF" : "OT"} ·{" "}
                          {pedido.ordem_fornecimento_id || pedido.ordem_transporte_id}
                        </p>
                        <p className="text-sm">{pedido.motivo}</p>
                        <p className="text-xs text-muted-foreground">
                          Solicitada em{" "}
                          {new Date(pedido.solicitado_em).toLocaleString("pt-BR")}
                          {pedido.divergencia_id
                            ? ` · Divergência ${pedido.divergencia_id}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            pedido.status === "solicitada"
                              ? "secondary"
                              : pedido.status === "aprovada"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {pedido.status}
                        </Badge>

                        {ehGestor && pedido.status === "solicitada" ? (
                        <>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() => {
                              if (
                                pedido.ordem_fornecimento_id &&
                                pedido.necessidade_paciente === "continua"
                              ) {
                                setSolicitacaoAprovando(pedido.id);
                                setGerarRecotacao(false);
                                setDataValidadeRecotacao("");
                              } else {
                                void decidirCancelamento(pedido.id, true);
                              }
                            }}
                          >
                            Aprovar
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => {
                              setSolicitacaoRecusando(pedido.id);
                              setJustificativaRecusa("");
                            }}
                          >
                            Recusar
                          </Button>
                        </>
                      ) : null}

                      {pedido.status === "aprovada" && pedido.ordem_fornecimento_id && (
  <Button asChild size="sm" variant="outline">
    <Link href={`/fornecimento/${pedido.ordem_fornecimento_id}`}>
      Visualizar OF cancelada
    </Link>
  </Button>
                      )}

                      {pedido.status === "aprovada" && pedido.recotacao_id && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/cotacoes/${pedido.recotacao_id}`}>
                            Abrir recotação
                          </Link>
                        </Button>
                      )}

                      {pedido.divergencia_id ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/divergencias/${pedido.divergencia_id}`}>
                            Ver caso
                          </Link>
                        </Button>
                      ) : null}
                      </div>
                    </div>
                    {solicitacaoAprovando === pedido.id && (
                      <div className="space-y-3 rounded-md border p-4">
                        <p className="text-sm font-semibold">
                          Confirmar aprovação do cancelamento
                        </p>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={gerarRecotacao}
                            onChange={(e) => setGerarRecotacao(e.target.checked)}
                          />
                          Gerar nova cotação em rascunho (recotação)
                        </label>

                        {gerarRecotacao && (
                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Nova data de validade (se a cotação original já venceu)
                            </label>
                            <input
                              type="date"
                              value={dataValidadeRecotacao}
                              onChange={(e) => setDataValidadeRecotacao(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                              Se a cotação original ainda estiver válida, a nova cotação manterá a validade original.
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => {
                              setSolicitacaoAprovando(null);
                              setGerarRecotacao(false);
                              setDataValidadeRecotacao("");
                            }}
                          >
                            Cancelar
                          </Button>

                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() =>
                              void decidirCancelamento(pedido.id, true, gerarRecotacao)
                            }
                          >
                            Confirmar aprovação
                          </Button>
                        </div>
                      </div>
                    )}
                    {solicitacaoRecusando === pedido.id && (
                    <div className="space-y-3 rounded-md border p-4">
                      <label className="text-sm font-medium">
                        Justificativa da recusa
                      </label>

                      <Textarea
                        value={justificativaRecusa}
                        onChange={(e) => setJustificativaRecusa(e.target.value)}
                        placeholder="Descreva o motivo pelo qual o cancelamento está sendo recusado..."
                        rows={4}
                      />

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => {
                            setSolicitacaoRecusando(null);
                            setJustificativaRecusa("");
                          }}
                        >
                          Cancelar
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending || !justificativaRecusa.trim()}
                          onClick={() => void decidirCancelamento(pedido.id, false)}
                        >
                          Confirmar recusa
                        </Button>
                      </div>
                    </div>
                  )}
                    {pedido.status === "recusada" && pedido.justificativa_decisao ? (
                      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                        <p className="mb-2 text-sm font-semibold text-destructive">
                          Motivo da recusa
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {pedido.justificativa_decisao}
                        </p>
                      </div>
                    ) : null}

                    {pedido.status === "aprovada" && pedido.justificativa_decisao ? (
                      <div className="rounded-md border bg-muted/40 p-3">
                        <p className="mb-1 text-sm font-medium">Observação da decisão</p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {pedido.justificativa_decisao}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
