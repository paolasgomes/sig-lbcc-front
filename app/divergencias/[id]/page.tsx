"use client";

import Link from "next/link";
import { use, useState } from "react";
import { ArrowLeft, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useUsuarios } from "@/hooks/use-usuarios";
import { useAlterarImpedimento, useCorrigirOrdem, useDivergencia, useRegistrarProvidencia, useSolicitarCancelamento, useSubstituirVoucher, useTransicionarDivergencia } from "@/hooks/use-divergencias";
import { obterUrlEvidencia, type EvidenciaOrdem } from "@/services/comprovacoes-service";

function mensagemErro(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { erro?: string; message?: string } } }).response;
    return response?.data?.erro || response?.data?.message || "Não foi possível concluir a operação.";
  }
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

async function abrirEvidencia(evidencia: EvidenciaOrdem) {
  try {
    const url = await obterUrlEvidencia(evidencia.id);
    const link = document.createElement("a"); link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer"; link.click();
  } catch { toast.error("Não foi possível abrir a evidência."); }
}

function Arquivos({ items }: { items?: EvidenciaOrdem[] }) {
  if (!items?.length) return null;
  return <div className="mt-2 flex flex-wrap gap-2">{items.map((item) => <Button key={item.id} type="button" variant="outline" size="sm" onClick={() => void abrirEvidencia(item)}><FileText className="mr-2 h-4 w-4" />{item.nome_arquivo}</Button>)}</div>;
}

export default function DivergenciaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { usuario } = useAuth();
  const { usuarios } = useUsuarios();
  const { divergencia, isLoading, error, refetch } = useDivergencia(id);
  const transicionar = useTransicionarDivergencia();
  const providencia = useRegistrarProvidencia();
  const impedimento = useAlterarImpedimento();
  const correcao = useCorrigirOrdem();
  const substituicao = useSubstituirVoucher();
  const cancelamento = useSolicitarCancelamento();
  const ehGestor = usuario?.perfil === "gestor";
  const ehOperador = ehGestor || usuario?.perfil === "operador";
  const [descricaoProvidencia, setDescricaoProvidencia] = useState("");
  const [observacoesProvidencia, setObservacoesProvidencia] = useState("");
  const [arquivosProvidencia, setArquivosProvidencia] = useState<File[]>([]);
  const [responsavelProvidencia, setResponsavelProvidencia] = useState("");
  const [previsaoRegularizacao, setPrevisaoRegularizacao] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [justificativaClassificacao, setJustificativaClassificacao] = useState("");
  const [justificativaCorrecao, setJustificativaCorrecao] = useState("");
  const [justificativaVoucher, setJustificativaVoucher] = useState("");
  const [comprovacao, setComprovacao] = useState("");
  const [campoCorrecao, setCampoCorrecao] = useState("observacoes");
  const [valorCorrecao, setValorCorrecao] = useState("");
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [voucherId, setVoucherId] = useState("");

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    try { await acao(); toast.success(sucesso); setJustificativa(""); setComprovacao(""); await refetch(); }
    catch (error) { toast.error(mensagemErro(error)); }
  }

  async function salvarProvidencia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await providencia.mutate(id, { descricao: descricaoProvidencia.trim(), observacoes: observacoesProvidencia.trim(), responsavel_id: responsavelProvidencia || usuario?.id, previsao_regularizacao: previsaoRegularizacao || undefined, evidencias: arquivosProvidencia });
      setDescricaoProvidencia(""); setObservacoesProvidencia(""); setArquivosProvidencia([]); setPrevisaoRegularizacao(""); toast.success("Providência registrada.");
      if ((result as { aviso_evidencia?: string }).aviso_evidencia) toast.error((result as { aviso_evidencia: string }).aviso_evidencia);
      await refetch();
    } catch (error) { toast.error(mensagemErro(error)); }
  }

  async function registrarCorrecao(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!justificativaCorrecao.trim()) { toast.error("Informe a justificativa da correção."); return; }
    const value = valorCorrecao.trim();
    await executar(() => correcao.mutate(id, { campos: { [campoCorrecao]: value }, justificativa: justificativaCorrecao.trim() }), "Ordem corrigida com auditoria.");
    setValorCorrecao("");
    setJustificativaCorrecao("");
  }

  if (isLoading) return <DashboardLayout><p className="py-16 text-center text-sm text-muted-foreground">Carregando divergência…</p></DashboardLayout>;
  if (error || !divergencia) return <DashboardLayout><div className="space-y-4"><Button asChild variant="outline"><Link href="/divergencias"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button><Alert variant="destructive"><AlertDescription>{error instanceof Error ? error.message : "Divergência não encontrada."} <Button variant="link" onClick={() => void refetch()}>Tentar novamente</Button></AlertDescription></Alert></div></DashboardLayout>;

  const tipoOrdem = divergencia.ordem_fornecimento_id ? "OF" : "OT";
  const orderId = divergencia.ordem_fornecimento_id || divergencia.ordem_transporte_id || "";
  const terminal = ["resolvida", "encerrada_sem_solucao"].includes(divergencia.status);
  const camposPermitidos = tipoOrdem === "OF"
    ? [{ id: "observacoes", label: "Observações" }]
    : [{ id: "veiculo_placa", label: "Placa do veículo" }, { id: "tipo_combustivel", label: "Tipo de combustível" }, { id: "posto_abastecimento", label: "Posto de abastecimento" }, { id: "validade_ate", label: "Validade do voucher" }, { id: "observacoes", label: "Observações" }];

  return <DashboardLayout><div className="space-y-6">
    <Button asChild variant="outline"><Link href="/divergencias"><ArrowLeft className="mr-2 h-4 w-4" />Voltar para divergências</Link></Button>
    <div><h1 className="text-2xl font-semibold">Tratamento de divergência</h1><p className="text-sm text-muted-foreground">Caso {divergencia.id} · {tipoOrdem} {divergencia.ordem?.numero || orderId}</p></div>

    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{divergencia.descricao}</CardTitle><div className="flex gap-2"><Badge variant={divergencia.impeditiva ? "destructive" : "secondary"}>{divergencia.impeditiva ? "Impeditiva" : "Não impeditiva"}</Badge><Badge>{divergencia.status.replaceAll("_", " ")}</Badge></div></div></CardHeader><CardContent className="space-y-3 text-sm"><p><strong>Tipo:</strong> {divergencia.tipo.replaceAll("_", " ")}</p><p><strong>Identificada em:</strong> {new Date(divergencia.identificado_em).toLocaleString("pt-BR")}</p><p><strong>Ordem:</strong> {tipoOrdem} {divergencia.ordem?.numero || orderId} · status {divergencia.ordem?.status || "—"}</p><p><strong>Registrada por:</strong> {divergencia.registrado_por}</p><Arquivos items={divergencia.evidencias} />{divergencia.dados_detectados && Object.keys(divergencia.dados_detectados).length ? <details className="rounded-md border p-3"><summary className="cursor-pointer font-medium">Dados detectados</summary><pre className="mt-2 overflow-auto text-xs">{JSON.stringify(divergencia.dados_detectados, null, 2)}</pre></details> : null}</CardContent></Card>

    {!terminal && <Card><CardHeader><CardTitle>Ações de tratamento</CardTitle></CardHeader><CardContent className="space-y-5">
      {ehGestor && divergencia.status === "aberta" ? <Button disabled={transicionar.isPending} onClick={() => void executar(() => transicionar.mutate(id, { status: "em_tratamento", justificativa: "Início do tratamento." }), "Divergência movida para tratamento.")}>Iniciar tratamento</Button> : null}

      {ehOperador ? <form onSubmit={salvarProvidencia} className="space-y-3 rounded-md border p-4"><h3 className="font-semibold">Registrar providência</h3><div className="space-y-2"><Label htmlFor="providencia-descricao">Providência executada ou planejada</Label><Textarea id="providencia-descricao" value={descricaoProvidencia} onChange={(event) => setDescricaoProvidencia(event.target.value)} required maxLength={3000} /></div><div className="grid gap-3 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="providencia-responsavel">Responsável pela providência</Label><select id="providencia-responsavel" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={responsavelProvidencia || usuario?.id || ""} onChange={(event) => setResponsavelProvidencia(event.target.value)} required><option value="">Selecione</option>{usuarios.filter((item) => item.ativo).map((item) => <option key={item.id} value={item.id}>{item.nome}{item.id === usuario?.id ? " (usuário atual)" : ""}</option>)}</select></div><div className="space-y-2"><Label htmlFor="providencia-previsao">Previsão de regularização (opcional)</Label><Input id="providencia-previsao" type="datetime-local" value={previsaoRegularizacao} onChange={(event) => setPrevisaoRegularizacao(event.target.value)} /></div></div><div className="space-y-2"><Label htmlFor="providencia-observacoes">Observações</Label><Textarea id="providencia-observacoes" value={observacoesProvidencia} onChange={(event) => setObservacoesProvidencia(event.target.value)} maxLength={3000} /></div><div className="space-y-2"><Label htmlFor="providencia-evidencias">Evidências (opcional)</Label><Input id="providencia-evidencias" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setArquivosProvidencia(Array.from(event.target.files || []))} /></div><Button type="submit" disabled={providencia.isPending || !(responsavelProvidencia || usuario?.id)}>{providencia.isPending ? "Salvando…" : "Registrar providência"}</Button></form> : null}

      {ehGestor ? <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={(event) => { event.preventDefault(); void executar(() => impedimento.mutate(id, { impeditiva: !divergencia.impeditiva, justificativa: justificativaClassificacao.trim() }), "Grau de impedimento atualizado."); }} className="space-y-3 rounded-md border p-4"><h3 className="font-semibold">Classificação</h3><p className="text-sm">Atual: {divergencia.impeditiva ? "impeditiva" : "não impeditiva"}</p><div className="space-y-2"><Label htmlFor="justificativa-classificacao">Justificativa</Label><Input id="justificativa-classificacao" value={justificativaClassificacao} onChange={(event) => setJustificativaClassificacao(event.target.value)} required /></div><Button type="submit" variant="outline" disabled={impedimento.isPending}>Alterar para {divergencia.impeditiva ? "não impeditiva" : "impeditiva"}</Button></form>

        <form onSubmit={registrarCorrecao} className="space-y-3 rounded-md border p-4"><h3 className="font-semibold">Correção administrativa</h3><div className="space-y-2"><Label htmlFor="campo-correcao">Campo</Label><select id="campo-correcao" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={campoCorrecao} onChange={(event) => setCampoCorrecao(event.target.value)}>{camposPermitidos.map((campo) => <option key={campo.id} value={campo.id}>{campo.label}</option>)}</select></div><div className="space-y-2"><Label htmlFor="valor-correcao">Novo valor</Label><Input id="valor-correcao" type={campoCorrecao === "validade_ate" ? "date" : "text"} value={valorCorrecao} onChange={(event) => setValorCorrecao(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="justificativa-correcao">Justificativa</Label><Input id="justificativa-correcao" value={justificativaCorrecao} onChange={(event) => setJustificativaCorrecao(event.target.value)} required /></div><Button type="submit" variant="outline" disabled={correcao.isPending}>Aplicar correção</Button></form>
      </div> : null}

      {ehGestor && tipoOrdem === "OT" && divergencia.tipo === "voucher_perdido_recusado" ? <form onSubmit={(event) => { event.preventDefault(); void executar(() => substituicao.mutate(id, { voucher_id: voucherId, justificativa: justificativaVoucher.trim() }), "Voucher anterior invalidado e segunda via emitida."); }} className="space-y-3 rounded-md border p-4"><h3 className="font-semibold">Substituir voucher</h3><select aria-label="Voucher a invalidar" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={voucherId} onChange={(event) => setVoucherId(event.target.value)} required><option value="">Selecione o voucher anterior</option>{(divergencia.vouchers || []).filter((voucher) => !voucher.invalidado_em).map((voucher) => <option key={String(voucher.id)} value={String(voucher.id)}>Via {String(voucher.numero_via)} · {String(voucher.codigo || voucher.tipo_via)}</option>)}</select><Input aria-label="Justificativa da substituição" placeholder="Justificativa" value={justificativaVoucher} onChange={(event) => setJustificativaVoucher(event.target.value)} required /><Button type="submit" variant="outline" disabled={substituicao.isPending}>Emitir segunda via</Button></form> : null}

      {ehOperador && divergencia.tipo === "execucao_inviavel" ? <form onSubmit={(event) => { event.preventDefault(); void executar(() => cancelamento.mutate(id, motivoCancelamento.trim()), "Solicitação encaminhada para decisão do gestor."); setMotivoCancelamento(""); }} className="space-y-3 rounded-md border p-4"><h3 className="font-semibold">Encaminhar para cancelamento RF_F14</h3><p className="text-sm text-muted-foreground">A solicitação mantém a ordem ativa até a decisão do gestor.</p><Textarea value={motivoCancelamento} onChange={(event) => setMotivoCancelamento(event.target.value)} placeholder="Motivo do cancelamento" required maxLength={2000} /><Button type="submit" variant="outline" disabled={cancelamento.isPending}>Solicitar cancelamento</Button></form> : null}

      {ehGestor ? <div className="space-y-3 rounded-md border p-4"><h3 className="font-semibold">Encerrar divergência</h3><div className="grid gap-3 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="transicao-justificativa">Justificativa</Label><Textarea id="transicao-justificativa" value={justificativa} onChange={(event) => setJustificativa(event.target.value)} required /></div>{divergencia.status === "em_tratamento" ? <div className="space-y-2"><Label htmlFor="transicao-comprovacao">Comprovação da solução (obrigatória para resolver)</Label><Textarea id="transicao-comprovacao" value={comprovacao} onChange={(event) => setComprovacao(event.target.value)} /></div> : null}</div><div className="flex flex-wrap gap-2">{divergencia.status === "em_tratamento" ? <Button disabled={transicionar.isPending || !justificativa.trim() || !comprovacao.trim()} onClick={() => void executar(() => transicionar.mutate(id, { status: "resolvida", justificativa: justificativa.trim(), comprovacao: comprovacao.trim() }), "Divergência resolvida.")}>Resolver</Button> : null}<Button variant="outline" disabled={transicionar.isPending || !justificativa.trim()} onClick={() => void executar(() => transicionar.mutate(id, { status: "encerrada_sem_solucao", justificativa: justificativa.trim() }), "Divergência encerrada sem solução.")}>Encerrar sem solução</Button></div></div> : null}
    </CardContent></Card>}

    <Card><CardHeader><CardTitle>Providências e histórico auditável</CardTitle></CardHeader><CardContent className="space-y-4">
      {divergencia.providencias?.length ? <div className="space-y-3">{divergencia.providencias.map((item) => <div key={String(item.id)} className="rounded-md border p-4"><p className="font-medium">{String(item.descricao)}</p>{item.observacoes ? <p className="mt-1 text-sm">{String(item.observacoes)}</p> : null}<p className="mt-2 text-xs text-muted-foreground">Registrada em {new Date(String(item.data_providencia)).toLocaleString("pt-BR")} · por {usuarios.find((user) => user.id === item.registrado_por)?.nome || String(item.registrado_por)}</p><p className="text-xs text-muted-foreground">Responsável: {usuarios.find((user) => user.id === item.responsavel_id)?.nome || String(item.responsavel_id || "não informado")}{item.previsao_regularizacao ? ` · Previsão: ${new Date(String(item.previsao_regularizacao)).toLocaleString("pt-BR")}` : ""}</p><Arquivos items={item.evidencias as EvidenciaOrdem[] | undefined} /></div>)}</div> : <p className="text-sm text-muted-foreground">Nenhuma providência registrada.</p>}
      <div className="space-y-2 border-t pt-4">{divergencia.eventos?.map((evento, index) => <div key={String(evento.id || index)} className="rounded-md bg-muted/50 p-3 text-sm"><p className="font-medium">{String(evento.acao).replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{new Date(String(evento.created_at)).toLocaleString("pt-BR")} · por {String(evento.usuario_id || "sistema")}</p>{evento.justificativa ? <p className="mt-1">{String(evento.justificativa)}</p> : null}{evento.status_anterior || evento.status_novo ? <p className="text-xs">Situação: {String(evento.status_anterior || "—")} → {String(evento.status_novo || "—")}</p> : null}</div>)}</div>
      {divergencia.cancelamentos?.map((item) => <div key={item.id} className="rounded-md border p-3 text-sm"><p className="font-medium">Cancelamento {item.status}</p><p>{item.motivo}</p>{item.justificativa_decisao ? <p>Decisão: {item.justificativa_decisao}</p> : null}</div>)}
      <Button type="button" variant="outline" onClick={() => void refetch()}><RefreshCw className="mr-2 h-4 w-4" />Atualizar histórico</Button>
    </CardContent></Card>
  </div></DashboardLayout>;
}
