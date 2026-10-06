"use client";

import Link from "next/link";
import { use, useState } from "react";
import { ArrowLeft, CheckCircle, Download, Mail, Pencil, RotateCcw, Save, X } from "lucide-react";


import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from "@/components/ui/table";

import {
useAtualizarPrazoOrdemDeFornecimento,
useConfirmarRecebimentoOrdemDeFornecimento,
useFinalizarOrdemDeFornecimento,
useGestoresResponsaveis,
    useLembreteFornecedor,
useOrdemDeFornecimento,
    useReenviarLembreteFornecedor,
    useReenviarEmailOrdemDeFornecimento,
} from "@/hooks/use-fornecimento";
import { baixarPdfOrdemDeFornecimento } from "@/services/fornecimento-service";
import { useAuth } from "@/contexts/auth-context";
import { PerfilUsuario } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateOnly, getStatusPrazoLabel } from "@/lib/prazo-utils";

function formatDate(date: string | null) {
if (!date) return "-";

const [year, month, day] = date.split("-");

if (!year || !month || !day) return date;

return `${day}/${month}/${year}`;
}

function formatCurrency(value: number) {
return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
}).format(value);
}

const lembreteStatusLabels = {
    pendente: "Pendente",
    enviado: "Enviado",
    falha_recuperavel: "Falha recuperável",
    falha_definitiva: "Falha definitiva",
} as const;

function formatDateTime(date: string | null) {
    if (!date) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(date));
}

function formatStatusEnvio(status: string | null | undefined) {
    const labels: Record<string, string> = {
        nao_enviado: "Não enviado",
        pendente: "Envio pendente",
        enviando: "Enviando",
        enviado: "Email enviado",
        falhou_retentando: "Falha — retentando",
        falhou_definitivo: "Falha no envio",
    };

    return labels[status ?? "nao_enviado"] ?? "Não enviado";
}

function formatPrazoEvent(evento: string) {
    const labels: Record<string, string> = {
        PRAZO_CICLO_ATUALIZADO: "Novo ciclo de prazo",
        RESPONSAVEIS_ATUALIZADOS: "Responsáveis atualizados",
        PRAZO_PROXIMIDADE_ATINGIDA: "Proximidade do prazo",
        PRAZO_ATRASO_ATINGIDO: "Atraso identificado",
        ORDEM_FINALIZADA: "Ordem finalizada",
    };

    return labels[evento] ?? evento;
}

export default function OrdemDeFornecimentoPage({
params,
}: {
params: Promise<{ id: string }>;
}) {
const { id } = use(params);

const { ordem, isLoading, error } = useOrdemDeFornecimento(id);
const {
    confirmarRecebimento: confirmarRecebimentoMutation,
    isConfirming,
    error: confirmError,
} = useConfirmarRecebimentoOrdemDeFornecimento();
const { finalizar, isFinalizing, error: finalizeError } = useFinalizarOrdemDeFornecimento();
const { lembrete, error: lembreteError } = useLembreteFornecedor(id);
const { reenviar, isUpdating: isReenviando, error: reenvioError } = useReenviarLembreteFornecedor();
const {
    reenviarEmail: reenviarEmailMutation,
    isReenviandoEmail,
    error: emailReenvioError,
} = useReenviarEmailOrdemDeFornecimento();
const { usuario } = useAuth();
const { gestores } = useGestoresResponsaveis();
const { atualizarPrazo, isUpdating, error: updateError } = useAtualizarPrazoOrdemDeFornecimento();
const [editandoPrazo, setEditandoPrazo] = useState(false);
const [dataLimite, setDataLimite] = useState("");
const [responsavelIds, setResponsavelIds] = useState<string[]>([]);
const [reenvioConcluido, setReenvioConcluido] = useState(false);
const [emailReenvioConcluido, setEmailReenvioConcluido] = useState(false);
const [baixandoPdf, setBaixandoPdf] = useState(false);

const ehGestor = usuario?.perfil === PerfilUsuario.GESTOR;

function iniciarEdicaoPrazo() {
    if (!ordem) return;
    setDataLimite(ordem.data_previsao_entrega?.slice(0, 10) ?? "");
    setResponsavelIds((ordem.gestores_responsaveis ?? []).map((gestor) => gestor.id));
    setEditandoPrazo(true);
}

function alternarResponsavel(id: string) {
    setResponsavelIds((atual) =>
        atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id],
    );
}

async function salvarPrazo() {
    if (!ordem) return;
    await atualizarPrazo({
        id: ordem.id,
        data_previsao_entrega: dataLimite || null,
        responsavel_ids: responsavelIds,
    });
    setEditandoPrazo(false);
}

async function reenviarLembrete() {
    if (!ordem) return;
    setReenvioConcluido(false);
    try {
        await reenviar(ordem.id);
        setReenvioConcluido(true);
    } catch {
        // A mensagem da mutation permanece disponivel para a renderizacao.
    }
}

async function confirmarRecebimento() {
    if (!ordem || !window.confirm("Confirmar que o fornecedor recebeu esta ordem? A ordem passará para Em entrega.")) return;

    try {
        await confirmarRecebimentoMutation(ordem.id);
    } catch {
        // A mensagem da mutation permanece disponível para a renderização.
    }
}

async function baixarPdf() {
    if (!ordem) return;
    setBaixandoPdf(true);

    try {
        const { blob, filename } = await baixarPdfOrdemDeFornecimento(ordem.id);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Erro ao baixar PDF da ordem:", error);
    } finally {
        setBaixandoPdf(false);
    }
}

async function reenviarEmail() {
    if (!ordem || !window.confirm("Reenviar o email da ordem com o PDF anexado?")) return;
    setEmailReenvioConcluido(false);

    try {
        await reenviarEmailMutation(ordem.id);
        setEmailReenvioConcluido(true);
    } catch {
        // A mensagem da mutation permanece disponível para a renderização.
    }
}

async function finalizarOrdem() {
    if (!ordem || !window.confirm("Finalizar esta ordem de fornecimento?")) return;
    try {
        await finalizar(ordem.id);
    } catch {
        // A mensagem da mutation permanece disponivel para a renderizacao.
    }
}

if (isLoading) {
    return (
    <DashboardLayout>
        <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
            Carregando ordem de fornecimento...
        </p>
        </div>
    </DashboardLayout>
    );
}

if (error || !ordem) {
    return (
    <DashboardLayout>
        <div className="space-y-6">
        <Button asChild variant="outline">
            <Link href="/fornecimento">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
            </Link>
        </Button>

        <Card>
            <CardContent className="pt-6">
            <p className="text-sm text-destructive">
                {error || "Ordem de fornecimento não encontrada."}
            </p>
            </CardContent>
        </Card>
        </div>
    </DashboardLayout>
    );
}

const fornecedor =
    ordem.fornecedores?.nome_fantasia ||
    ordem.fornecedores?.razao_social ||
    "-";

return (
    <DashboardLayout>
    <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="icon">
            <Link href="/fornecimento">
                <ArrowLeft className="h-4 w-4" />
            </Link>
            </Button>

            <div>
            <h1 className="text-2xl font-semibold">
                Ordem de Fornecimento
            </h1>

            <p className="text-sm text-muted-foreground">
                {ordem.numero}
            </p>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <StatusBadge status={ordem.status} />
            {(usuario?.perfil === PerfilUsuario.OPERADOR || ehGestor) && ordem.status === "enviada" && (
                <Button variant="outline" size="sm" onClick={() => void confirmarRecebimento()} disabled={isConfirming}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isConfirming ? "Confirmando..." : "Confirmar recebimento"}
                </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => void baixarPdf()} disabled={baixandoPdf}>
                <Download className="mr-2 h-4 w-4" />
                {baixandoPdf ? "Baixando..." : "Baixar PDF"}
            </Button>
            {ehGestor && ["rascunho", "enviada"].includes(ordem.status) && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void reenviarEmail()}
                    disabled={isReenviandoEmail || ["pendente", "enviando"].includes(ordem.status_envio)}
                >
                    <Mail className="mr-2 h-4 w-4" />
                    {isReenviandoEmail ? "Reenviando..." : "Reenviar email"}
                </Button>
            )}
            {ehGestor && !["finalizada", "cancelada", "rascunho"].includes(ordem.status) && (
                <Button variant="outline" size="sm" onClick={() => void finalizarOrdem()} disabled={isFinalizing}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isFinalizing ? "Finalizando..." : "Finalizar ordem"}
                </Button>
            )}
        </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
            <CardTitle>Fornecedor</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
            <div>
                <p className="text-sm text-muted-foreground">
                Nome
                </p>

                <p className="font-medium">
                {fornecedor}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                CNPJ
                </p>

                <p>
                {ordem.fornecedores?.cnpj || "-"}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                Telefone
                </p>

                <p>
                {ordem.fornecedores?.telefone || "-"}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                E-mail
                </p>

                <p>
                {ordem.fornecedores?.email || "-"}
                </p>
            </div>
            </CardContent>
        </Card>

        {(finalizeError || updateError) && (
            <p className="text-sm text-destructive">{finalizeError || updateError}</p>
        )}

        {confirmError && (
            <p className="text-sm text-destructive">{confirmError}</p>
        )}

        <Card>
            <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Envio da ordem</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            O PDF baixado corresponde ao último email enviado com sucesso; se não houver envio, um PDF atual será gerado.
                        </p>
                    </div>
                    <Badge variant={ordem.status_envio?.startsWith("falhou") ? "destructive" : "outline"}>
                        {formatStatusEnvio(ordem.status_envio)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <p className="text-sm text-muted-foreground">Destinatário</p>
                        <p className="font-medium break-all">{ordem.fornecedores?.email || "-"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Tentativas</p>
                        <p className="font-medium">{ordem.email_envio_tentativas ?? 0}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Último sucesso</p>
                        <p className="font-medium">{formatDateTime(ordem.email_envio_ultimo_sucesso_em)}</p>
                    </div>
                </div>
                {ordem.email_envio_ultimo_erro && (
                    <p className="text-sm text-destructive">Último erro: {ordem.email_envio_ultimo_erro}</p>
                )}
                {(emailReenvioError || emailReenvioConcluido) && (
                    <p className={emailReenvioError ? "text-sm text-destructive" : "text-sm text-green-700"}>
                        {emailReenvioError || "Reenvio solicitado com sucesso."}
                    </p>
                )}
                <div className="space-y-2">
                    <p className="text-sm font-medium">Histórico de envios</p>
                    {!ordem.envios_email?.length ? (
                        <p className="text-sm text-muted-foreground">Nenhuma tentativa registrada.</p>
                    ) : (
                        ordem.envios_email.map((envio) => (
                            <div key={envio.id} className="flex flex-col gap-1 border-b pb-2 last:border-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant={envio.status === "falhou" ? "destructive" : "outline"}>
                                        {envio.status === "enviado" ? "Enviado" : envio.status === "falhou" ? "Falhou" : envio.status}
                                    </Badge>
                                    <span className="text-sm">Ciclo {envio.ciclo} · tentativa {envio.tentativa}</span>
                                    <span className="text-xs text-muted-foreground">{formatDateTime(envio.enviado_em || envio.falhou_em || envio.created_at)}</span>
                                </div>
                                {envio.erro && <p className="text-xs text-destructive">{envio.erro}</p>}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>

        <Card>
        <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <CardTitle>Lembrete ao fornecedor</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                O lembrete não inclui dados do paciente.
                </p>
            </div>
            {lembrete && (
                <Badge variant={lembrete.status.startsWith("falha") ? "destructive" : "outline"}>
                {lembreteStatusLabels[lembrete.status]}
                </Badge>
            )}
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            {lembreteError ? (
            <p className="text-sm text-destructive">{lembreteError}</p>
            ) : !lembrete ? (
            <p className="text-sm text-muted-foreground">
                O lembrete ainda não foi agendado para este ciclo de prazo.
            </p>
            ) : (
            <>
                <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <p className="text-sm text-muted-foreground">Tentativas</p>
                    <p className="font-medium">{lembrete.tentativasRealizadas}/3</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Última tentativa</p>
                    <p className="font-medium">{formatDateTime(lembrete.ultimaTentativaEm)}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Destinatário utilizado</p>
                    <p className="font-medium break-all">{lembrete.ultimoDestinatarioEmail || "-"}</p>
                </div>
                </div>
                {lembrete.ultimoErro && (
                <p className="text-sm text-destructive">Último erro: {lembrete.ultimoErro}</p>
                )}
                {(reenvioError || reenvioConcluido) && (
                <p className={reenvioError ? "text-sm text-destructive" : "text-sm text-green-700"}>
                    {reenvioError || "Reenvio solicitado com sucesso."}
                </p>
                )}
                {ehGestor && lembrete.status.startsWith("falha") && lembrete.tentativasRealizadas < 3 && (
                <Button variant="outline" onClick={() => void reenviarLembrete()} disabled={isReenviando}>
                    {isReenviando ? <RotateCcw className="animate-spin" /> : <Mail />}
                    Reenviar lembrete
                </Button>
                )}
            </>
            )}
        </CardContent>
        </Card>

        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Histórico do prazo</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Os eventos de proximidade, atraso, prorrogação e finalização são preservados por ciclo.
                </p>
            </CardHeader>
            <CardContent>
                {!ordem.prazo_historico?.length ? (
                    <p className="text-sm text-muted-foreground">Nenhum evento de prazo registrado.</p>
                ) : (
                    <div className="space-y-3">
                        {ordem.prazo_historico.map((evento) => (
                            <div key={evento.id} className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium">{formatPrazoEvent(evento.tipo_evento)}</span>
                                    <StatusBadge status={evento.status_prazo} />
                                    <span className="text-xs text-muted-foreground">Ciclo {evento.ciclo}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    Limite: {formatDateOnly(evento.data_limite)} · {formatDateTime(evento.created_at)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <CardTitle>Informações da ordem</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
            <div>
                <p className="text-sm text-muted-foreground">
                Cotação
                </p>

                <p className="font-medium">
                {ordem.cotacao_id}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                Data de emissão
                </p>

                <p>
                {formatDate(ordem.data_emissao)}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                Recebimento confirmado em
                </p>
                <p>
                {formatDateTime(ordem.recebido_em)}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                Data de entrega
                </p>

                <p>
                {formatDate(ordem.data_entrega)}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                Data de finalização
                </p>

                <p>
                {formatDate(ordem.data_finalizacao)}
                </p>
            </div>
            </CardContent>
        </Card>
        </div>

        <Card>
        <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Prazo de atendimento</CardTitle>
            {ehGestor && !editandoPrazo && (
                <Button variant="outline" size="sm" onClick={iniciarEdicaoPrazo}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar prazo e responsáveis
                </Button>
            )}
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            {editandoPrazo ? (
            <>
                <div className="max-w-xs">
                <label className="mb-2 block text-sm font-medium">Data limite de atendimento</label>
                <Input type="date" value={dataLimite} onChange={(event) => setDataLimite(event.target.value)} />
                </div>
                <div>
                <p className="mb-2 text-sm font-medium">Gestores responsáveis</p>
                <div className="grid gap-2 sm:grid-cols-2">
                    {gestores.map((gestor) => (
                    <label key={gestor.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={responsavelIds.includes(gestor.id)} onChange={() => alternarResponsavel(gestor.id)} />
                        <span>{gestor.nome}</span>
                    </label>
                    ))}
                </div>
                </div>
                {updateError && <p className="text-sm text-destructive">{updateError}</p>}
                <div className="flex gap-2">
                <Button onClick={() => void salvarPrazo()} disabled={isUpdating}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar prazo
                </Button>
                <Button variant="outline" onClick={() => setEditandoPrazo(false)}>
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                </Button>
                </div>
            </>
            ) : (
            <div className="grid gap-4 md:grid-cols-3">
                <div>
                <p className="text-sm text-muted-foreground">Data limite de atendimento</p>
                <p className="font-medium">{formatDateOnly(ordem.data_previsao_entrega)}</p>
                </div>
                <div>
                <p className="text-sm text-muted-foreground">Status do prazo</p>
                <StatusBadge status={ordem.status_prazo ?? "normal"} />
                <p className="mt-1 text-xs text-muted-foreground">{getStatusPrazoLabel(ordem.status_prazo ?? "normal")}</p>
                </div>
                <div>
                <p className="text-sm text-muted-foreground">Ciclo do prazo</p>
                <p className="font-medium">{ordem.prazo_ciclo ?? 1}</p>
                </div>
                <div className="md:col-span-3">
                <p className="text-sm text-muted-foreground">Gestores responsáveis</p>
                <p className="font-medium">
                    {ordem.gestores_responsaveis?.length
                    ? ordem.gestores_responsaveis.map((gestor) => gestor.nome).join(", ")
                    : "Nenhum gestor atribuído"}
                </p>
                </div>
            </div>
            )}
        </CardContent>
        </Card>

        <Card>
        <CardHeader>
            <CardTitle>Itens da ordem</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Valor unitário</TableHead>
                <TableHead>Valor total</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {ordem.ordem_fornecimento_itens.length === 0 ? (
                <TableRow>
                    <TableCell
                    colSpan={5}
                    className="text-center py-8"
                    >
                    Nenhum item encontrado.
                    </TableCell>
                </TableRow>
                ) : (
                ordem.ordem_fornecimento_itens.map((item) => (
                    <TableRow key={item.id}>
                    <TableCell>
                        {item.descricao}
                    </TableCell>

                    <TableCell>
                        {item.quantidade_solicitada}
                    </TableCell>

                    <TableCell>
                        {item.unidade}
                    </TableCell>

                    <TableCell>
                        {formatCurrency(
                        Number(item.valor_unitario)
                        )}
                    </TableCell>

                    <TableCell>
                        {formatCurrency(
                        Number(item.valor_total)
                        )}
                    </TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
            </Table>
        </CardContent>
        </Card>

        <Card>
        <CardContent className="pt-6">
            <div className="flex justify-end">
            <div className="text-right">
                <p className="text-sm text-muted-foreground">
                Valor total
                </p>

                <p className="text-2xl font-semibold">
                {formatCurrency(Number(ordem.valor_total))}
                </p>
            </div>
            </div>
        </CardContent>
        </Card>

        {ordem.observacoes && (
        <Card>
            <CardHeader>
            <CardTitle>Observações</CardTitle>
            </CardHeader>

            <CardContent>
            <p className="text-sm whitespace-pre-wrap">
                {ordem.observacoes}
            </p>
            </CardContent>
        </Card>
        )}
    </div>
    </DashboardLayout>
);
}
