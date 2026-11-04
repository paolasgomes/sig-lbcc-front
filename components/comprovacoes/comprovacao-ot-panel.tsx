"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinalizarOrdemTransporte, useRegistrarUtilizacaoOT, useUtilizacoesOT } from "@/hooks/use-comprovacoes";
import { useVouchersTransporte } from "@/hooks/use-transporte";
import { DivergenciasDaOrdemPanel } from "@/components/divergencias/divergencias-da-ordem-panel";
import { obterUrlEvidencia, type EvidenciaOrdem } from "@/services/comprovacoes-service";
import type { OrdemTransporte, VoucherTransporte } from "@/services/transporte-service";

function erroDaApi(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { erro?: string; message?: string; codigo?: string; divergencia_id?: string; divergencias?: Array<{ id: string }> } } }).response;
    return response?.data ?? {};
  }
  return { erro: error instanceof Error ? error.message : "Não foi possível concluir a operação." };
}

function formatarQuantidade(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);
}

async function abrirEvidencia(evidencia: EvidenciaOrdem) {
  try {
    const url = await obterUrlEvidencia(evidencia.id);
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  } catch {
    toast.error("Não foi possível abrir a evidência.");
  }
}

interface Props {
  ordem: OrdemTransporte;
  podeRegistrar: boolean;
}

export function ComprovacaoOTPanel({ ordem, podeRegistrar }: Props) {
  const router = useRouter();
  const { vouchers = [] as VoucherTransporte[] } = useVouchersTransporte(ordem.id);
  const { utilizacoes, isLoading, error, refetch } = useUtilizacoesOT(ordem.id);
  const { registrar, isSubmitting } = useRegistrarUtilizacaoOT(ordem.id);
  const { finalizar, isFinalizing } = useFinalizarOrdemTransporte(ordem.id);
  const [voucherId, setVoucherId] = useState("");
  const [dataUtilizacao, setDataUtilizacao] = useState(() => {
    const date = new Date();
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  });
  const [posto, setPosto] = useState(ordem.posto_abastecimento ?? "");
  const [quantidade, setQuantidade] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const vouchersUtilizaveis = vouchers.filter((voucher) => !voucher.invalidado_em);
  const totalUtilizado = useMemo(() => utilizacoes.reduce((total, item) => total + Number(item.quantidade), 0), [utilizacoes]);
  const saldo = Math.max(Number(ordem.quantidade_autorizada ?? 0) - totalUtilizado, 0);
  const elegivel = podeRegistrar && ["entregue", "utilizacao_comprovada"].includes(ordem.status);
  const pendente = ordem.status === "entregue" && utilizacoes.length === 0;

  async function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(quantidade);
    if (!voucherId || !dataUtilizacao || !posto.trim() || !Number.isFinite(value) || value <= 0 || value > saldo) {
      toast.error("Informe voucher, data, posto e uma quantidade positiva dentro do saldo autorizado.");
      return;
    }
    if (arquivos.length > 5 || arquivos.some((file) => file.size > 5 * 1024 * 1024)) {
      toast.error("Anexe no máximo cinco arquivos de até 5 MB cada.");
      return;
    }
    try {
      await registrar({ voucher_id: voucherId, data_utilizacao: dataUtilizacao, posto_abastecimento: posto.trim(), quantidade: value, evidencias: arquivos, idempotencyKey });
      toast.success("Utilização do voucher registrada.");
      setQuantidade("");
      setArquivos([]);
      setIdempotencyKey(crypto.randomUUID());
      await refetch();
    } catch (error) {
      const response = erroDaApi(error);
      if (response.codigo === "DIVERGENCIA_CRIADA" && response.divergencia_id) {
        setIdempotencyKey(crypto.randomUUID());
        toast.error(response.erro || "A utilização não foi contabilizada e foi encaminhada ao RF_F13.", {
          action: { label: "Abrir divergência", onClick: () => router.push(`/divergencias/${response.divergencia_id}`) },
        });
        return;
      }
      toast.error(response.erro || response.message || "Não foi possível registrar a utilização.");
    }
  }

  async function finalizarOT() {
    try {
      await finalizar();
      toast.success("Ordem de Transporte finalizada.");
    } catch (error) {
      const response = erroDaApi(error);
      if (response.codigo === "DIVERGENCIA_IMPEDITIVA") {
        const primeira = response.divergencias?.[0]?.id;
        toast.error(response.erro || "Divergências impeditivas bloqueiam a finalização.", {
          action: { label: "Abrir RF_F13", onClick: () => router.push(primeira ? `/divergencias/${primeira}` : "/divergencias") },
        });
        return;
      }
      toast.error(response.erro || response.message || "Não foi possível finalizar a OT.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilização do voucher</CardTitle>
        <p className="text-sm text-muted-foreground">A entrega do voucher não comprova o abastecimento. Registre cada utilização e acompanhe o saldo da OT.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>Autorizado: <strong>{formatarQuantidade(Number(ordem.quantidade_autorizada ?? 0))}</strong></span>
          <span>Utilizado: <strong>{formatarQuantidade(totalUtilizado)}</strong></span>
          <span>Saldo: <strong>{formatarQuantidade(saldo)}</strong></span>
          {pendente ? <Badge variant="secondary">Utilização pendente</Badge> : null}
          {ordem.status === "utilizacao_comprovada" ? <Badge>Utilização registrada · aguardando finalização</Badge> : null}
          {ordem.status === "finalizada" ? <Badge>Finalizada</Badge> : null}
        </div>

        {error ? <Alert variant="destructive"><AlertDescription>Não foi possível carregar o histórico. <Button variant="link" onClick={() => void refetch()}>Tentar novamente</Button></AlertDescription></Alert> : null}
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando utilizações…</p> : null}

        {elegivel && saldo > 0 && vouchersUtilizaveis.length > 0 ? (
          <form onSubmit={salvar} className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">Registrar utilização</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor={`ot-voucher-${ordem.id}`}>Voucher entregue</Label><select id={`ot-voucher-${ordem.id}`} className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={voucherId} onChange={(event) => setVoucherId(event.target.value)} required><option value="">Selecione</option>{vouchersUtilizaveis.filter((voucher) => voucher.entregue_em).map((voucher) => <option key={voucher.id} value={voucher.id}>Via {voucher.numero_via} · {voucher.codigo}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor={`ot-data-${ordem.id}`}>Data e hora da utilização</Label><Input id={`ot-data-${ordem.id}`} type="datetime-local" value={dataUtilizacao} onChange={(event) => setDataUtilizacao(event.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor={`ot-posto-${ordem.id}`}>Posto de abastecimento</Label><Input id={`ot-posto-${ordem.id}`} value={posto} onChange={(event) => setPosto(event.target.value)} required maxLength={200} /></div>
              <div className="space-y-2"><Label htmlFor={`ot-quantidade-${ordem.id}`}>Quantidade abastecida</Label><Input id={`ot-quantidade-${ordem.id}`} type="number" min="0.001" max={saldo} step="0.001" value={quantidade} onChange={(event) => setQuantidade(event.target.value)} required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor={`ot-evidencias-${ordem.id}`}>Comprovante (opcional)</Label><Input id={`ot-evidencias-${ordem.id}`} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setArquivos(Array.from(event.target.files || []))} /><p className="text-xs text-muted-foreground">Até cinco arquivos PDF ou imagens, com no máximo 5 MB cada.</p></div>
            <Button type="submit" disabled={isSubmitting || saldo <= 0}>{isSubmitting ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Registrando…</> : "Salvar utilização"}</Button>
          </form>
        ) : null}
        {elegivel && vouchersUtilizaveis.filter((voucher) => voucher.entregue_em).length === 0 ? <p className="text-sm text-muted-foreground">É necessário registrar a entrega de um voucher antes de informar a utilização.</p> : null}

        {utilizacoes.length > 0 ? <div className="space-y-3"><h3 className="font-semibold">Histórico de utilizações</h3>{utilizacoes.map((item) => <div key={item.id} className="rounded-lg border p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{new Date(item.data_utilizacao).toLocaleString("pt-BR")} · {formatarQuantidade(Number(item.quantidade))}</p><span className="text-xs text-muted-foreground">Registrada em {new Date(item.created_at).toLocaleString("pt-BR")}</span></div><p className="text-sm text-muted-foreground">Posto: {item.posto_abastecimento} · Voucher: {item.voucher ? `via ${item.voucher.numero_via}` : "não identificado"} · Registrado por {item.registrado_por}</p>{item.evidencias.map((file) => <Button key={file.id} className="mt-3 mr-2" variant="outline" size="sm" onClick={() => void abrirEvidencia(file)}><FileText className="mr-2 h-4 w-4" />{file.nome_arquivo}</Button>)}</div>)}</div> : !isLoading ? <p className="text-sm text-muted-foreground">Nenhuma utilização comprovada. A OT continua pendente de uso.</p> : null}

        {podeRegistrar && ordem.status === "utilizacao_comprovada" ? <Button type="button" variant="outline" disabled={isFinalizing} onClick={() => void finalizarOT()}>{isFinalizing ? "Finalizando…" : "Finalizar Ordem de Transporte"}</Button> : null}
        <DivergenciasDaOrdemPanel tipoOrdem="OT" ordemId={ordem.id} podeRegistrar={podeRegistrar} />
      </CardContent>
    </Card>
  );
}
