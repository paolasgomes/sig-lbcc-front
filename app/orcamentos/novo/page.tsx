"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";

import { useCotacoes, useCotacao } from "@/hooks/use-cotacoes";
import { useFornecedores } from "@/hooks/use-fornecedores";
import { useOrcamentos } from "@/hooks/use-orcamentos";

interface ItemOrcamentoForm {
  itemId: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: string;
  observacoes: string;
}

export default function NovoOrcamentoPage() {
  const router = useRouter();

  const [cotacaoId, setCotacaoId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [dataProposta, setDataProposta] = useState("");
  const [validadeProposta, setValidadeProposta] = useState("");
  const [prazoEntrega, setPrazoEntrega] = useState("");
  const [condicoesPagamento, setCondicoesPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [itens, setItens] = useState<ItemOrcamentoForm[]>([]);

  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const {
    cotacoes,
    isLoading: carregandoCotacoes,
    error: erroCotacoes,
  } = useCotacoes(true);

  const {
    fornecedores,
    isLoading: carregandoFornecedores,
    error: erroFornecedores,
  } = useFornecedores();

  const {
    cotacao,
    isLoading: carregandoCotacao,
    error: erroCotacao,
  } = useCotacao(cotacaoId);

  const { criar } = useOrcamentos();

  const valorTotal = useMemo(() => {
    return itens.reduce((total, item) => {
      const valorUnitario =
        Number(item.valorUnitario.replace(",", ".")) || 0;

      return total + item.quantidade * valorUnitario;
    }, 0);
  }, [itens]);

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleSelecionarCotacao = (id: string) => {
    setCotacaoId(id);
    setItens([]);
    setErroSalvar(null);
  };

  const carregarItensDaCotacao = () => {
    if (!cotacao) return;

    const novosItens: ItemOrcamentoForm[] = cotacao.itens.map((item) => ({
      itemId: item.id,
      descricao: item.descricao,
      quantidade: Number(item.quantidade ?? 0),
      unidade: item.unidade ?? "UN",
      valorUnitario: "",
      observacoes: "",
    }));

    setItens(novosItens);
    setErroSalvar(null);
  };

  const removerItem = (index: number) => {
    setItens((atual) =>
      atual.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const atualizarItem = (
    index: number,
    campo: keyof ItemOrcamentoForm,
    valor: string | number,
  ) => {
    setItens((atual) =>
      atual.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [campo]: valor,
            }
          : item,
      ),
    );

    setErroSalvar(null);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErroSalvar(null);

    if (!cotacaoId) {
      setErroSalvar("Selecione uma cotação.");
      return;
    }

    if (!fornecedorId) {
      setErroSalvar("Selecione um fornecedor.");
      return;
    }

    if (!dataProposta) {
      setErroSalvar("Informe a data da proposta.");
      return;
    }

    if (itens.length === 0) {
      setErroSalvar(
        "Carregue pelo menos um item da cotação.",
      );
      return;
    }

    const itensComValorInvalido = itens.some((item) => {
      const valor = Number(
        item.valorUnitario.replace(",", "."),
      );

      return !Number.isFinite(valor) || valor <= 0;
    });

    if (itensComValorInvalido) {
      setErroSalvar(
        "Informe um valor unitário maior que zero para todos os itens.",
      );
      return;
    }

    const itensComQuantidadeInvalida = itens.some(
      (item) =>
        !Number.isFinite(item.quantidade) ||
        item.quantidade <= 0,
    );

    if (itensComQuantidadeInvalida) {
      setErroSalvar(
        "Todos os itens precisam ter uma quantidade maior que zero.",
      );
      return;
    }

    try {
      setSalvando(true);

      await criar({
        cotacaoId,
        fornecedorId,
        dataProposta,
        validadeProposta:
          validadeProposta || undefined,
        prazoEntrega: prazoEntrega || undefined,
        condicoesPagamento:
          condicoesPagamento || undefined,
        observacoes: observacoes || undefined,

        itens: itens.map((item) => ({
          itemId: item.itemId,
          valorUnitario: Number(
            item.valorUnitario.replace(",", "."),
          ),
          observacoes:
            item.observacoes || undefined,
        })),
      });

      router.push("/orcamentos");
    } catch (error) {
      setErroSalvar(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o orçamento.",
      );
    } finally {
      setSalvando(false);
    }
  };

  const erroCarregamento =
    erroCotacoes ||
    erroFornecedores ||
    erroCotacao ||
    null;

  return (
    <DashboardLayout
      allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              asChild
            >
              <Link href="/orcamentos">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>

            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Novo Orçamento
              </h1>

              <p className="text-muted-foreground">
                Cadastre uma proposta de fornecedor para uma cotação.
              </p>
            </div>
          </div>
        </div>

        {erroCarregamento && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />

            <AlertTitle>
              Erro ao carregar dados
            </AlertTitle>

            <AlertDescription>
              {erroCarregamento}
            </AlertDescription>
          </Alert>
        )}

        {erroSalvar && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />

            <AlertTitle>
              Não foi possível salvar
            </AlertTitle>

            <AlertDescription>
              {erroSalvar}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dados do orçamento</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Cotação *
              </label>

              <Select
                value={cotacaoId}
                onValueChange={handleSelecionarCotacao}
                disabled={
                  carregandoCotacoes || salvando
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      carregandoCotacoes
                        ? "Carregando cotações..."
                        : "Selecione uma cotação"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {cotacoes.map((cotacaoItem) => (
                    <SelectItem
                      key={cotacaoItem.id}
                      value={cotacaoItem.id}
                    >
                      {cotacaoItem.numero
                        ? `${cotacaoItem.numero} - ${cotacaoItem.descricao}`
                        : cotacaoItem.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Fornecedor *
              </label>

              <Select
                value={fornecedorId}
                onValueChange={setFornecedorId}
                disabled={
                  carregandoFornecedores || salvando
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      carregandoFornecedores
                        ? "Carregando fornecedores..."
                        : "Selecione um fornecedor"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem
                      key={fornecedor.id}
                      value={fornecedor.id}
                    >
                      {fornecedor.nomeFantasia ||
                        fornecedor.razaoSocial ||
                        fornecedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="dataProposta"
                className="text-sm font-medium"
              >
                Data da proposta *
              </label>

              <Input
                id="dataProposta"
                type="date"
                value={dataProposta}
                onChange={(event) =>
                  setDataProposta(event.target.value)
                }
                required
                disabled={salvando}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="validadeProposta"
                className="text-sm font-medium"
              >
                Validade da proposta
              </label>

              <Input
                id="validadeProposta"
                type="date"
                value={validadeProposta}
                onChange={(event) =>
                  setValidadeProposta(
                    event.target.value,
                  )
                }
                disabled={salvando}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="prazoEntrega"
                className="text-sm font-medium"
              >
                Prazo de entrega
              </label>

              <Input
                id="prazoEntrega"
                placeholder="Ex.: 10 dias úteis"
                value={prazoEntrega}
                onChange={(event) =>
                  setPrazoEntrega(event.target.value)
                }
                disabled={salvando}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="condicoesPagamento"
                className="text-sm font-medium"
              >
                Condições de pagamento
              </label>

              <Input
                id="condicoesPagamento"
                placeholder="Ex.: 30 dias"
                value={condicoesPagamento}
                onChange={(event) =>
                  setCondicoesPagamento(
                    event.target.value,
                  )
                }
                disabled={salvando}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="observacoes"
                className="text-sm font-medium"
              >
                Observações
              </label>

              <Textarea
                id="observacoes"
                placeholder="Observações sobre a proposta..."
                value={observacoes}
                onChange={(event) =>
                  setObservacoes(event.target.value)
                }
                disabled={salvando}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Itens e preços</CardTitle>

            {cotacao && (
              <Button
                type="button"
                variant="outline"
                onClick={carregarItensDaCotacao}
                disabled={
                  carregandoCotacao || salvando
                }
              >
                {carregandoCotacao
                  ? "Carregando..."
                  : "Carregar itens da cotação"}
              </Button>
            )}
          </CardHeader>

          <CardContent>
            {!cotacaoId ? (
              <div className="rounded-md border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Selecione uma cotação para visualizar os
                  itens.
                </p>
              </div>
            ) : itens.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Os itens da cotação ainda não foram
                  carregados.
                </p>

                {cotacao && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={carregarItensDaCotacao}
                    disabled={carregandoCotacao || salvando}
                  >
                    Carregar itens
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Descrição
                      </TableHead>

                      <TableHead className="w-[120px]">
                        Quantidade
                      </TableHead>

                      <TableHead className="w-[100px]">
                        Unidade
                      </TableHead>

                      <TableHead className="w-[180px]">
                        Valor unitário
                      </TableHead>

                      <TableHead className="w-[160px]">
                        Total
                      </TableHead>

                      <TableHead className="w-[60px]" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {itens.map((item, index) => {
                      const valorUnitario =
                        Number(
                          item.valorUnitario.replace(
                            ",",
                            ".",
                          ),
                        ) || 0;

                      const totalItem =
                        item.quantidade *
                        valorUnitario;

                      return (
                        <TableRow
                          key={item.itemId}
                        >
                          <TableCell>
                            <Input
                              value={item.descricao}
                              onChange={(event) =>
                                atualizarItem(
                                  index,
                                  "descricao",
                                  event.target.value,
                                )
                              }
                              disabled={salvando}
                            />
                          </TableCell>

                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantidade}
                              onChange={(event) =>
                                atualizarItem(
                                  index,
                                  "quantidade",
                                  Number(
                                    event.target.value,
                                  ),
                                )
                              }
                              disabled={salvando}
                            />
                          </TableCell>

                          <TableCell>
                            <Input
                              value={item.unidade}
                              onChange={(event) =>
                                atualizarItem(
                                  index,
                                  "unidade",
                                  event.target.value,
                                )
                              }
                              disabled={salvando}
                            />
                          </TableCell>

                          <TableCell>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="0,00"
                              value={item.valorUnitario}
                              onChange={(event) =>
                                atualizarItem(
                                  index,
                                  "valorUnitario",
                                  event.target.value,
                                )
                              }
                              disabled={salvando}
                            />
                          </TableCell>

                          <TableCell className="font-medium">
                            {formatarMoeda(
                              totalItem,
                            )}
                          </TableCell>

                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removerItem(index)
                              }
                              disabled={salvando}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <div className="rounded-lg border bg-muted/30 px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Valor total
                </p>

                <p className="text-2xl font-bold">
                  {formatarMoeda(valorTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            asChild
            disabled={salvando}
          >
            <Link href="/orcamentos">
              Cancelar
            </Link>
          </Button>

          <Button
            type="submit"
            disabled={
              salvando ||
              !cotacaoId ||
              !fornecedorId ||
              !dataProposta ||
              itens.length === 0
            }
          >
            {salvando
              ? "Salvando..."
              : "Salvar orçamento"}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}