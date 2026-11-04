"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FileText, Plus, RefreshCw, X } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useComprovacoesOF, useRegistrarComprovacaoOF } from '@/hooks/use-comprovacoes';
import { obterUrlEvidencia, type EvidenciaOrdem, type ItemComprovacaoOF } from '@/services/comprovacoes-service';

interface Props {
  ordemId: string;
  status: string;
  podeRegistrar: boolean;
  itensOrdem: Array<{ id: string; descricao: string; unidade?: string | null; quantidade_solicitada: number }>;
  nomeUsuario: string;
}

function readApiError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { erro?: string; message?: string; codigo?: string; divergencia_id?: string } } }).response;
    return response?.data ?? {};
  }
  return { erro: error instanceof Error ? error.message : 'Não foi possível concluir a operação.' };
}

function moedaQuantidade(value: number, unidade?: string | null) {
  const formatted = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(value);
  return `${formatted}${unidade ? ` ${unidade}` : ''}`;
}

async function abrirEvidencia(evidencia: EvidenciaOrdem) {
  try {
    const url = await obterUrlEvidencia(evidencia.id);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.click();
  } catch {
    toast.error('Não foi possível abrir a evidência.');
  }
}

export function ComprovacaoOFPanel({ ordemId, status, podeRegistrar, itensOrdem, nomeUsuario }: Props) {
  const router = useRouter();
  const { historico, isLoading, error, refetch } = useComprovacoesOF(ordemId);
  const { registrar, isSubmitting } = useRegistrarComprovacaoOF(ordemId);
  const [aberto, setAberto] = useState(false);
  const [dataExecucao, setDataExecucao] = useState(() => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }));
  const [executor, setExecutor] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [quantidades, setQuantidades] = useState<Record<string, string>>({});
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const elegivel = podeRegistrar && ['enviada', 'em_entrega', 'entregue'].includes(status);
  const linhas = useMemo(() => historico?.itens ?? [], [historico?.itens]);
  const saldos = new Map(linhas.map((item) => [item.id, item]));
  const resumoCompleto = useMemo(() => linhas.length > 0 && linhas.every((item) => item.status_atendimento === 'integral'), [linhas]);

  async function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const preenchidas = Object.entries(quantidades).filter(([, value]) => value.trim() !== "");
    const itens = preenchidas.map(([item_id, value]) => ({ item_id, quantidade: Number(value) }));
    if (itens.some((item) => !Number.isFinite(item.quantidade) || item.quantidade <= 0)) {
      toast.error("Cada quantidade informada deve ser maior que zero.");
      return;
    }
    if (!dataExecucao || itens.length === 0) {
      toast.error('Informe a data e ao menos uma quantidade executada.');
      return;
    }
    if (arquivos.length > 5) {
      toast.error('Anexe no máximo cinco evidências.');
      return;
    }
    const ultrapassaSaldo = itens.some((item) => item.quantidade > Number(
      saldos.get(item.item_id)?.saldo
        ?? itensOrdem.find((linha) => linha.id === item.item_id)?.quantidade_solicitada
        ?? 0
    ));
    if (ultrapassaSaldo) {
      toast.warning('A quantidade excede o saldo exibido. O backend encaminhará a tentativa para RF_F13, sem contabilizá-la como execução autorizada.');
    }
    try {
      await registrar({
        data_execucao: dataExecucao,
        responsavel_execucao_nome: executor.trim(),
        observacoes: observacoes.trim(),
        itens,
        evidencias: arquivos,
        idempotencyKey,
      });
      toast.success('Comprovação de execução registrada.');
      setQuantidades({});
      setExecutor('');
      setObservacoes('');
      setArquivos([]);
      setIdempotencyKey(crypto.randomUUID());
      await refetch();
    } catch (error) {
      const payload = readApiError(error);
      if (payload.codigo === 'DIVERGENCIA_CRIADA' && payload.divergencia_id) {
        setIdempotencyKey(crypto.randomUUID());
        toast.error('A quantidade ultrapassa o saldo autorizado. A tentativa foi registrada em RF_F13 e não foi contabilizada.', {
          action: { label: 'Abrir divergência', onClick: () => router.push(`/divergencias/${payload.divergencia_id}`) },
        });
        return;
      }
      toast.error(payload.erro || payload.message || 'Não foi possível registrar a comprovação.');
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Comprovações de execução</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Histórico por item, com quantidades acumuladas e saldo restante.</p>
        </div>
        {podeRegistrar ? <Button variant={aberto ? 'outline' : 'default'} size="sm" disabled={!elegivel} onClick={() => setAberto((value) => !value)}>
          {aberto ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {aberto ? 'Fechar' : 'Registrar comprovação'}
        </Button> : null}
      </CardHeader>
      <CardContent className="space-y-5">
        {!podeRegistrar && <p className="text-sm text-muted-foreground">Seu perfil pode consultar o histórico, mas não registrar comprovações.</p>}
        {podeRegistrar && !elegivel && <p className="text-sm text-muted-foreground">Esta OF não aceita novas comprovações no estado atual.</p>}
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando comprovações…</p> : null}
        {error ? (
          <Alert variant="destructive"><AlertDescription>Não foi possível carregar as comprovações. <Button variant="link" onClick={() => void refetch()}>Tentar novamente</Button></AlertDescription></Alert>
        ) : null}

        {linhas.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Autorizado</TableHead><TableHead>Comprovado</TableHead><TableHead>Saldo</TableHead><TableHead>Atendimento</TableHead></TableRow></TableHeader>
              <TableBody>{linhas.map((item: ItemComprovacaoOF) => (
                <TableRow key={item.id}>
                  <TableCell>{item.descricao}</TableCell>
                  <TableCell>{moedaQuantidade(Number(item.quantidade_solicitada), item.unidade)}</TableCell>
                  <TableCell>{moedaQuantidade(Number(item.quantidade_comprovada), item.unidade)}</TableCell>
                  <TableCell>{moedaQuantidade(Number(item.saldo), item.unidade)}</TableCell>
                  <TableCell><Badge variant={item.status_atendimento === 'integral' ? 'default' : 'secondary'}>{item.status_atendimento === 'integral' ? 'Integral' : item.status_atendimento === 'parcial' ? 'Parcial' : 'Pendente'}</Badge></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </div>
        )}
        {resumoCompleto && <p className="text-sm font-medium text-green-700">Todos os itens estão integralmente comprovados.</p>}

        {aberto && elegivel && (
          <form onSubmit={salvar} className="space-y-4 rounded-lg border p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="of-comprovacao-data">Data da execução</Label><Input id="of-comprovacao-data" type="date" required value={dataExecucao} onChange={(event) => setDataExecucao(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="of-comprovacao-executor">Responsável pela execução</Label><Input id="of-comprovacao-executor" value={executor} onChange={(event) => setExecutor(event.target.value)} placeholder={`Usuário atual: ${nomeUsuario}`} maxLength={150} /><p className="text-xs text-muted-foreground">Preencha se a execução foi feita por outra pessoa. O usuário conectado fica registrado na auditoria.</p></div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Itens executados</p>
              <div className="space-y-3">{itensOrdem.map((item) => {
                const resumo = saldos.get(item.id);
                const limite = resumo?.saldo ?? Number(item.quantidade_solicitada);
                return (
                  <div key={item.id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_170px] sm:items-center">
                    <div><p className="font-medium">{item.descricao}</p><p className="text-xs text-muted-foreground">Autorizado: {moedaQuantidade(Number(item.quantidade_solicitada), item.unidade)} · Saldo: {moedaQuantidade(Number(limite), item.unidade)}</p></div>
                    <Input aria-label={`Quantidade executada de ${item.descricao}`} type="number" min="0.001" step="0.001" value={quantidades[item.id] ?? ''} onChange={(event) => setQuantidades((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Quantidade" disabled={limite <= 0} />
                  </div>
                );
              })}</div>
            </div>

            <div className="space-y-2"><Label htmlFor="of-comprovacao-observacoes">Observações</Label><Textarea id="of-comprovacao-observacoes" value={observacoes} onChange={(event) => setObservacoes(event.target.value)} rows={3} maxLength={2000} /></div>
            <div className="space-y-2"><Label htmlFor="of-comprovacao-arquivos">Evidências (opcional)</Label><Input id="of-comprovacao-arquivos" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setArquivos(Array.from(event.target.files || []))} /><p className="text-xs text-muted-foreground">Até cinco arquivos PDF ou imagens, com no máximo 5 MB cada.</p></div>
            <div className="flex flex-wrap gap-2"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Registrando…</> : 'Salvar comprovação'}</Button><Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setAberto(false)}>Cancelar</Button></div>
          </form>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold">Histórico preservado</h3>
          {!historico?.comprovacoes.length && !isLoading ? <p className="text-sm text-muted-foreground">Nenhuma comprovação registrada.</p> : null}
          {historico?.comprovacoes.map((comprovacao) => (
            <div key={comprovacao.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">Execução em {new Date(`${comprovacao.data_execucao}T12:00:00`).toLocaleDateString('pt-BR')}</p><span className="text-xs text-muted-foreground">Registrada em {new Date(comprovacao.created_at).toLocaleString('pt-BR')}</span></div>
              <p className="mt-1 text-sm text-muted-foreground">Registrada por {comprovacao.registrado_por}{comprovacao.responsavel_execucao_nome ? ` · Executada por ${comprovacao.responsavel_execucao_nome}` : ''}</p>
              <ul className="mt-3 list-inside list-disc text-sm">{comprovacao.itens.map((line) => {
                const item = itensOrdem.find((entry) => entry.id === line.ordem_fornecimento_item_id);
                return <li key={line.ordem_fornecimento_item_id}>{item?.descricao || 'Item'}: {moedaQuantidade(Number(line.quantidade), item?.unidade)}</li>;
              })}</ul>
              {comprovacao.observacoes && <p className="mt-2 text-sm">{comprovacao.observacoes}</p>}
              {comprovacao.evidencias?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{comprovacao.evidencias.map((file) => <Button key={file.id} variant="outline" size="sm" onClick={() => void abrirEvidencia(file)}><FileText className="mr-2 h-4 w-4" />{file.nome_arquivo}</Button>)}</div>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
