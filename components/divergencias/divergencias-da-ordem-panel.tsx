"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Plus } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCriarDivergencia, useDivergencias } from "@/hooks/use-divergencias";
import type { TipoDivergencia, TipoOrdemDivergencia } from "@/services/divergencias-service";

const tipos: Array<{ id: TipoDivergencia; label: string }> = [
  { id: "erro_administrativo", label: "Erro administrativo" },
  { id: "fornecimento_parcial", label: "Fornecimento parcial" },
  { id: "atraso_pendencia", label: "Atraso ou pendência" },
  { id: "voucher_perdido_recusado", label: "Voucher perdido ou recusado" },
  { id: "execucao_inviavel", label: "Execução inviável" },
  { id: "quantidade_excedente", label: "Quantidade excedente" },
  { id: "posto_divergente", label: "Posto divergente" },
  { id: "outro", label: "Outro" },
];

function mensagemErro(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { erro?: string } } }).response;
    return response?.data?.erro || "Não foi possível registrar a divergência.";
  }
  return error instanceof Error ? error.message : "Não foi possível registrar a divergência.";
}

export function DivergenciasDaOrdemPanel({ tipoOrdem, ordemId, podeRegistrar }: { tipoOrdem: TipoOrdemDivergencia; ordemId: string; podeRegistrar: boolean }) {
  const router = useRouter();
  const { divergencias, isLoading, error, refetch } = useDivergencias({ tipo_ordem: tipoOrdem, ordem_id: ordemId });
  const { mutate: criar, isPending } = useCriarDivergencia();
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoDivergencia>("outro");
  const [descricao, setDescricao] = useState("");
  const [impeditiva, setImpeditiva] = useState(true);

  async function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await criar({ tipo_ordem: tipoOrdem, ordem_id: ordemId, tipo, descricao: descricao.trim(), impeditiva, idempotencyKey: crypto.randomUUID() });
      toast.success("Divergência registrada.");
      router.push(`/divergencias/${response.id}`);
    } catch (error) {
      toast.error(mensagemErro(error));
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div><CardTitle>Divergências RF_F13</CardTitle><p className="mt-1 text-sm text-muted-foreground">Registros e providências ligados a esta ordem.</p></div>
        {podeRegistrar ? <Button type="button" size="sm" variant={aberto ? "outline" : "default"} onClick={() => setAberto((value) => !value)}><Plus className="mr-2 h-4 w-4" />{aberto ? "Fechar" : "Registrar divergência"}</Button> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <Alert variant="destructive"><AlertDescription>Não foi possível carregar divergências. <Button variant="link" onClick={() => void refetch()}>Tentar novamente</Button></AlertDescription></Alert> : null}
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : null}
        {aberto ? <form onSubmit={salvar} className="space-y-3 rounded-md border p-4">
          <div className="space-y-2"><Label htmlFor={`divergencia-tipo-${ordemId}`}>Tipo</Label><select id={`divergencia-tipo-${ordemId}`} className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={tipo} onChange={(event) => setTipo(event.target.value as TipoDivergencia)}>{tipos.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
          <div className="space-y-2"><Label htmlFor={`divergencia-descricao-${ordemId}`}>Descrição da inconsistência</Label><Textarea id={`divergencia-descricao-${ordemId}`} value={descricao} onChange={(event) => setDescricao(event.target.value)} required maxLength={4000} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={impeditiva} onChange={(event) => setImpeditiva(event.target.checked)} />Impeditiva para a conclusão da ordem</label>
          <Button type="submit" disabled={isPending || !descricao.trim()}>{isPending ? "Registrando…" : "Registrar e abrir"}</Button>
        </form> : null}
        {divergencias.length ? <div className="space-y-2">{divergencias.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"><div className="flex min-w-0 items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><div><p className="font-medium">{item.descricao}</p><p className="text-xs text-muted-foreground">{new Date(item.identificado_em).toLocaleString("pt-BR")}</p></div></div><div className="flex items-center gap-2"><Badge variant={item.impeditiva ? "destructive" : "secondary"}>{item.impeditiva ? "Impeditiva" : "Não impeditiva"}</Badge><Badge>{item.status.replaceAll("_", " ")}</Badge><Button type="button" variant="outline" size="sm" onClick={() => router.push(`/divergencias/${item.id}`)}>Acompanhar</Button></div></div>)}</div> : !isLoading && !aberto ? <p className="text-sm text-muted-foreground">Nenhuma divergência registrada para esta ordem.</p> : null}
      </CardContent>
    </Card>
  );
}
