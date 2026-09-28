"use client";

import { use, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useCotacao } from "@/hooks/use-cotacoes";
import { useProdutos } from "@/hooks/use-produtos";
import { useUsuario } from "@/hooks/use-usuario";
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";

import {
  isCotacaoVencida,
  formatCotacaoNumero,
  formatDateOnly,
} from "@/lib/cotacoes-utils";

import { Button } from "@/components/ui/button";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { StatusBadge } from "@/components/shared/status-badge";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  ArrowLeft,
  Pencil,
  FileText,
  AlertTriangle,
  XCircle,
  Trophy,
  Plus,
} from "lucide-react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { LancarOrcamentoInline } from "@/components/cotacoes/lancar-orcamento-inline";
import { AcoesOrcamento } from "@/components/cotacoes/acoes-orcamento";

import { toast } from "sonner";
import axios from "axios";

import {
  useGerarOrdensDeFornecimento,
  useOrdensDeFornecimento,
} from "@/hooks/use-fornecimento";

interface CotacaoDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatStatus(status: string) {
  const statusMap: Record<string, string> = {
    aberta: "Aberta",
    em_andamento: "Em andamento",
    pronta_para_analise: "Pronta para análise",
    finalizada: "Finalizada",
    cancelada: "Cancelada",
  };

  return statusMap[status] ?? status;
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, string> = {
    aberta: "aberta",
    em_andamento: "em_andamento",
    pronta_para_analise: "pronta_para_analise",
    finalizada: "finalizada",
    cancelada: "cancelada",
  };

  return statusMap[status] ?? status;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function CotacaoDetailPage({
  params,
}: CotacaoDetailPageProps) {
  const { id } = use(params);

  const {
    cotacao,
    isLoading,
    error,
    cancelarCotacao,
    isCanceling,
    criarOrcamentos,
    isCreatingOrcamentos,
    atualizarOrcamento,
    isUpdatingOrcamento,
    apagarOrcamento,
    isDeletingOrcamento,
    escolherVencedor,
    isEscolhendoVencedor,
  } = useCotacao(id);

  const { isGestor } = useUsuario();
  const { produtos } = useProdutos();

  const { gerarOrdens, isGenerating } =
    useGerarOrdensDeFornecimento();

  const { ordens: ordensDeFornecimento } =
    useOrdensDeFornecimento();

  const ordemDeFornecimento =
    ordensDeFornecimento.find(
      (ordem) =>
        ordem.cotacao_id === cotacao?.id,
    );

  const [actionError, setActionError] =
    useState<string | null>(null);

  const [motivoCancelamento, setMotivoCancelamento] =
    useState("");

  const [itemOrcamentoAberto, setItemOrcamentoAberto] =
    useState<string | null>(null);

  const produtosPorId = useMemo(
    () =>
      new Map(
        produtos.map((p) => [
          p.id,
          p.nome,
        ]),
      ),
    [produtos],
  );

  if (isLoading) {
    return (
      <DashboardLayout
        allowedRoles={
          ROLES_ATENDIMENTOS_E_COTACOES
        }
      >
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !cotacao) {
    notFound();
  }

  const vencida =
    cotacao.status !== "cancelada" &&
    cotacao.status !== "finalizada" &&
    isCotacaoVencida(
      cotacao.dataValidade,
    );

  const bloqueada =
    cotacao.status === "finalizada" ||
    cotacao.status === "cancelada";

  const podeMutarOrcamento =
    isGestor &&
    !bloqueada &&
    cotacao.ativo !== false;

  const isMutatingOrcamento =
    isCreatingOrcamentos ||
    isUpdatingOrcamento ||
    isDeletingOrcamento ||
    isEscolhendoVencedor;

  const formatDateTime = (
    dateStr: string,
  ) => {
    try {
      return format(
        new Date(dateStr),
        "dd/MM/yyyy HH:mm",
        {
          locale: ptBR,
        },
      );
    } catch {
      return dateStr;
    }
  };

  const handleCancelar = async () => {
    const motivo =
      motivoCancelamento.trim();

    if (!motivo) {
      setActionError(
        "Informe o motivo do cancelamento.",
      );
      return;
    }

    setActionError(null);

    try {
      await cancelarCotacao(motivo);
      setMotivoCancelamento("");
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Erro ao cancelar a cotação.",
      );
    }
  };

  const handleGerarOrdem = async () => {
    setActionError(null);

    try {
      const ordens =
        await gerarOrdens(
          cotacao.id,
        );

      const primeiraOrdem =
        ordens?.[0];

      toast.success(
        "Ordem de fornecimento gerada com sucesso!",
        {
          description:
            primeiraOrdem?.numero
              ? `Ordem ${primeiraOrdem.numero} criada.`
              : undefined,
        },
      );
    } catch (err) {
      const mensagem =
        axios.isAxiosError(err)
          ? err.response?.data?.message ||
            "Erro ao gerar ordem de fornecimento."
          : err instanceof Error
            ? err.message
            : "Erro ao gerar ordem de fornecimento.";

      setActionError(mensagem);

      toast.error(
        "Não foi possível gerar a ordem de fornecimento.",
        {
          description: mensagem,
        },
      );
    }
  };

  return (
    <DashboardLayout
      allowedRoles={
        ROLES_ATENDIMENTOS_E_COTACOES
      }
    >
      <div className="flex flex-col gap-6">

        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
            >
              <Link href="/cotacoes">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Cotação{" "}
                  {formatCotacaoNumero(
                    cotacao,
                  )}
                </h1>

                <StatusBadge
                  status={getStatusBadge(
                    cotacao.status,
                  )}
                />
              </div>

              <p className="text-muted-foreground">
                {cotacao.descricao}
              </p>
            </div>
          </div>

          {isGestor && (
            <div className="flex flex-wrap gap-2">

              {/* Gerar Ordem de Fornecimento */}
              {cotacao.status ===
                "finalizada" && (
                ordemDeFornecimento ? (
                  <Button
                    variant="outline"
                    asChild
                  >
                    <Link
                      href={`/fornecimento/${ordemDeFornecimento.id}`}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Visualizar Ordem de Fornecimento
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={
                      handleGerarOrdem
                    }
                    disabled={
                      isGenerating
                    }
                  >
                    <FileText className="mr-2 h-4 w-4" />

                    {isGenerating
                      ? "Gerando..."
                      : "Gerar Ordem de Fornecimento"}
                  </Button>
                )
              )}

              {/* Editar */}
              {!bloqueada && (
                <Button
                  variant="outline"
                  asChild
                >
                  <Link
                    href={`/cotacoes/${cotacao.id}/editar`}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </Button>
              )}

              {/* Cancelar cotação */}
              {!bloqueada && (
                <AlertDialog>
                  <AlertDialogTrigger
                    asChild
                  >
                    <Button
                      variant="outline"
                      className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
                      disabled={
                        isCanceling
                      }
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar cotação
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Cancelar cotação?
                      </AlertDialogTitle>

                      <AlertDialogDescription>
                        Essa ação é irreversível.
                        A cotação não será
                        excluída do banco de
                        dados, mas seu status
                        será alterado para
                        cancelada.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-2 py-2">
                      <Label htmlFor="motivo-cancelamento">
                        Motivo do cancelamento
                      </Label>

                      <Textarea
                        id="motivo-cancelamento"
                        placeholder="Informe o motivo do cancelamento..."
                        value={
                          motivoCancelamento
                        }
                        onChange={(
                          event,
                        ) =>
                          setMotivoCancelamento(
                            event.target
                              .value,
                          )
                        }
                        maxLength={1000}
                      />
                    </div>

                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() =>
                          setMotivoCancelamento(
                            "",
                          )
                        }
                      >
                        Voltar
                      </AlertDialogCancel>

                      <AlertDialogAction
                        onClick={
                          handleCancelar
                        }
                        disabled={
                          isCanceling ||
                          !motivoCancelamento.trim()
                        }
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isCanceling
                          ? "Cancelando..."
                          : "Confirmar cancelamento"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>

        {/* Erro */}
        {actionError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />

            <AlertTitle>
              Erro na operação
            </AlertTitle>

            <AlertDescription>
              {actionError}
            </AlertDescription>
          </Alert>
        )}

        {/* Aviso de vencimento */}
        {vencida && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />

            <AlertTitle>
              Cotação vencida
            </AlertTitle>

            <AlertDescription>
              A data de validade desta cotação
              já foi ultrapassada.
            </AlertDescription>
          </Alert>
        )}

        {/* Aviso de cancelamento */}
        {cotacao.status ===
          "cancelada" && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />

            <AlertTitle>
              Cotação cancelada
            </AlertTitle>

            <AlertDescription>
              <span className="font-medium">
                Motivo:
              </span>{" "}
              {cotacao.motivoCancelamento ??
                "Motivo não informado."}
            </AlertDescription>
          </Alert>
        )}

        {/* Informações gerais */}
        <Card>
          <CardHeader>
            <CardTitle>
              Informações gerais
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                Paciente
              </p>

              <p className="font-medium">
                {cotacao.pacienteNome ??
                  cotacao.pacienteId}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Área
              </p>

              <p className="font-medium">
                {cotacao.areaNome ??
                  cotacao.areaId}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Status
              </p>

              <p className="font-medium">
                {formatStatus(
                  cotacao.status,
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Validade
              </p>

              <div className="flex items-center gap-1 font-medium">
                {formatDateOnly(
                  cotacao.dataValidade,
                )}

                {vencida && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>

            {cotacao.observacoes && (
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">
                  Observações
                </p>

                <p>
                  {cotacao.observacoes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Itens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Itens
            </CardTitle>

            <CardDescription>
              {cotacao.itens.length} item(ns)
              incluído(s)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {cotacao.itens.map(
  (item, index) => {
    const orcamentos =
      item.orcamentos ?? [];

    const podeDefinirVencedor =
      orcamentos.length >= 3;

    const formularioAberto =
      item.id === itemOrcamentoAberto;

    return (
      <div
        key={item.id ?? index}
        className="rounded-lg border bg-background shadow-sm"
      >
        {/* Cabeçalho do item */}
        <div className="flex flex-col gap-3 border-b bg-muted/30 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Item {index + 1}
              </span>
            </div>

            <p className="text-base font-semibold">
              {item.descricao}
            </p>

            <p className="text-sm text-muted-foreground">
              {item.produtoId
                ? produtosPorId.get(
                    item.produtoId,
                  ) ?? "Produto removido"
                : "Sem produto vinculado"}
              {" · "}
              {item.quantidade}{" "}
              {item.unidade ?? "UN"}
              {item.especificacoes
                ? ` · ${item.especificacoes}`
                : ""}
            </p>
          </div>


        </div>

        {/* Área de orçamento do item */}
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">
                Orçamentos deste item
              </h3>

              <p className="text-xs text-muted-foreground">
                {orcamentos.length === 0
                  ? "Nenhum orçamento lançado"
                  : `${orcamentos.length} orçamento${
                      orcamentos.length > 1
                        ? "s"
                        : ""
                    } lançado${
                      orcamentos.length > 1
                        ? "s"
                        : ""
                    }`}
              </p>
            </div>

            {podeDefinirVencedor && (
              <Badge variant="secondary">
                Pronto para análise
              </Badge>
            )}
          </div>

          {/* Tabela de orçamentos */}
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>
                    Fornecedor
                  </TableHead>

                  <TableHead className="text-right">
                    Unitário
                  </TableHead>

                  <TableHead className="text-right">
                    Total
                  </TableHead>

                  {podeMutarOrcamento && (
                    <TableHead className="w-48 text-right">
                      Ações
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {orcamentos.map(
                  (orcamento) => (
                    <TableRow
                      key={orcamento.id}
                      className={cn(
                        orcamento.selecionada &&
                          "bg-primary/10 hover:bg-primary/15",
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-wrap items-center gap-2">
                          {orcamento.fornecedorNome}

                          {orcamento.selecionada && (
                            <Badge variant="secondary">
                              Vencedor
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        {formatBRL(
                          orcamento.valorUnitario,
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {formatBRL(
                          orcamento.valorTotal,
                        )}
                      </TableCell>

                      {podeMutarOrcamento &&
                        item.id && (
                          <TableCell className="whitespace-nowrap">
                            <AcoesOrcamento
                              orcamento={orcamento}
                              isBusy={
                                isMutatingOrcamento
                              }
                              podeDefinirVencedor={
                                podeDefinirVencedor
                              }
                              onDefinirVencedor={async () => {
                                await escolherVencedor({
                                  itemId:
                                    item.id as string,
                                  orcamentoId:
                                    orcamento.id,
                                });
                              }}
                              onCorrigir={async (
                                valorUnitario,
                              ) => {
                                await atualizarOrcamento({
                                  itemId:
                                    item.id as string,
                                  orcamentoId:
                                    orcamento.id,
                                  valorUnitario,
                                });
                              }}
                              onApagar={async () => {
                                await apagarOrcamento({
                                  itemId:
                                    item.id as string,
                                  orcamentoId:
                                    orcamento.id,
                                });
                              }}
                            />
                          </TableCell>
                        )}
                    </TableRow>
                  ),
                )}

                {/* Formulário de novo orçamento */}
                {podeMutarOrcamento &&
                  item.id &&
                  formularioAberto && (
                    <LancarOrcamentoInline
                      disabled={
                        !podeMutarOrcamento
                      }
                      isSubmitting={
                        isCreatingOrcamentos
                      }
                      fornecedorIdsNoItem={orcamentos.map(
                        (orcamento) =>
                          orcamento.fornecedorId,
                      )}
                      onSubmit={async (
                        blocos,
                      ) => {
                        await criarOrcamentos({
                          itemId:
                            item.id as string,
                          blocos,
                        });

                        setItemOrcamentoAberto(
                          null,
                        );
                      }}
                      onCancel={() =>
                        setItemOrcamentoAberto(
                          null,
                        )
                      }
                    />
                  )}

                {/* Nenhum orçamento */}
                {orcamentos.length === 0 &&
                  !formularioAberto && (
                    <TableRow>
                      <TableCell
                        colSpan={
                          podeMutarOrcamento
                            ? 4
                            : 3
                        }
                        className="h-20 text-center text-sm text-muted-foreground"
                      >
                        Nenhum orçamento lançado
                        para este item.
                      </TableCell>
                    </TableRow>
                  )}

                {/* Botão para lançar orçamento */}
                {podeMutarOrcamento &&
                  item.id &&
                  !formularioAberto && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={
                          podeMutarOrcamento
                            ? 4
                            : 3
                        }
                        className="px-3 py-3"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setItemOrcamentoAberto(
                              item.id as string,
                            )
                          }
                        >
                          <Plus className="h-4 w-4" />
                          Lançar orçamento
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  },
)}

            {cotacao.itens.length ===
              0 && (
              <p className="text-center text-muted-foreground">
                Nenhum item cadastrado.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Metadados */}
        <Card>
          <CardHeader>
            <CardTitle>
              Metadados
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                Criado em
              </span>

              <span>
                {formatDateTime(
                  cotacao.criadoEm,
                )}
              </span>
            </div>

            {cotacao.atualizadoEm && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Atualizado em
                </span>

                <span>
                  {formatDateTime(
                    cotacao.atualizadoEm,
                  )}
                </span>
              </div>
            )}

            {cotacao.status ===
              "cancelada" &&
              cotacao.motivoCancelamento && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">
                    Motivo do cancelamento
                  </span>

                  <span>
                    {
                      cotacao.motivoCancelamento
                    }
                  </span>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}