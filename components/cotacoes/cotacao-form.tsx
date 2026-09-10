"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  FileText,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  FieldGroup,
  Field,
  FieldLabel,
} from "@/components/ui/field";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { usePacientes } from "@/hooks/use-pacientes";
import { useAreas } from "@/hooks/use-areas";
import { useProdutos } from "@/hooks/use-produtos";
import { useCotacoes } from "@/hooks/use-cotacoes";

import type { Cotacao } from "@/types";

interface CotacaoFormProps {
  cotacao?: Cotacao;
  isEditing?: boolean;
}

type ItemFormRow = {
  id?: string;
  produtoId?: string;
  descricao: string;
  quantidade: number;
  especificacoes?: string;
};

export function CotacaoForm({
  cotacao,
  isEditing,
}: CotacaoFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pacienteIdFromUrl =
    searchParams.get("pacienteId");

  const { pacientes } = usePacientes();
  const { areas } = useAreas();
  const { produtos } = useProdutos();

  const {
    criarCotacao,
    atualizarCotacao,
    isCreating,
    isUpdating,
  } = useCotacoes();

  const [pacienteId, setPacienteId] = useState(
    cotacao?.pacienteId ||
      pacienteIdFromUrl ||
      "",
  );

  const [pacienteBusca, setPacienteBusca] =
    useState("");

  const [areaId, setAreaId] = useState(
    cotacao?.areaId || "",
  );

  const [descricao, setDescricao] = useState(
    cotacao?.descricao || "",
  );

  const [dataValidade, setDataValidade] =
    useState(cotacao?.dataValidade || "");

  const [observacoes, setObservacoes] =
    useState(cotacao?.observacoes || "");

  const [itens, setItens] = useState<ItemFormRow[]>(
    cotacao?.itens?.map((item) => ({
      id: item.id,
      produtoId: item.produtoId,
      descricao: item.descricao,
      quantidade: item.quantidade,
      especificacoes: item.especificacoes,
    })) || [
      {
        descricao: "",
        quantidade: 1,
      },
    ],
  );

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const pacientesAtivos = pacientes.filter(
    (p) => p.status === "ativo",
  );

  const areasAtivas = areas.filter(
    (a) => a.ativa !== false,
  );

  const pacienteSelecionado =
    pacientesAtivos.find(
      (p) => p.id === pacienteId,
    );

  const nomePacienteSelecionado =
    pacienteSelecionado?.nome ??
    pacienteSelecionado?.nomeCompleto ??
    "";

  const pacientesFiltrados = useMemo(() => {
    const busca = pacienteBusca
      .trim()
      .toLowerCase();

    if (!busca) {
      return [];
    }

    return pacientesAtivos.filter((p) => {
      const nome = (
        p.nome ??
        p.nomeCompleto ??
        ""
      ).toLowerCase();

      return nome.includes(busca);
    });
  }, [pacientesAtivos, pacienteBusca]);

  const produtosVinculadosIds = useMemo(
    () =>
      new Set(
        itens
          .map((item) => item.produtoId)
          .filter(Boolean) as string[],
      ),
    [itens],
  );

  const produtosParaSelecao = useMemo(
    () =>
      produtos.filter(
        (p) =>
          p.ativo !== false ||
          produtosVinculadosIds.has(p.id),
      ),
    [produtos, produtosVinculadosIds],
  );

  const produtosPorId = useMemo(
    () =>
      new Map(
        produtos.map((p) => [p.id, p]),
      ),
    [produtos],
  );

  const handleSelecionarPaciente = (
    id: string,
  ) => {
    setPacienteId(id);
    setPacienteBusca("");
  };

  const handleLimparPaciente = () => {
    setPacienteId("");
    setPacienteBusca("");
  };

  const handleAddRow = () => {
    setItens([
      ...itens,
      {
        descricao: "",
        quantidade: 1,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (itens.length <= 1) {
      return;
    }

    setItens(
      itens.filter((_, i) => i !== index),
    );
  };

  const handleItemChange = (
    index: number,
    field: keyof ItemFormRow,
    value: string | number,
  ) => {
    const updated = [...itens];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setItens(updated);
  };

  const handleSelecionarProduto = (
    index: number,
    produtoId: string,
  ) => {
    const produto =
      produtosParaSelecao.find(
        (p) => p.id === produtoId,
      );

    if (!produto) {
      return;
    }

    const updated = [...itens];

    updated[index] = {
      ...updated[index],
      produtoId: produto.id,
      descricao: produto.nome,
    };

    setItens(updated);
  };

  const validate = (): string | null => {
    if (!pacienteId) {
      return "Selecione um paciente.";
    }

    if (!areaId) {
      return "Selecione uma área.";
    }

    if (!descricao.trim()) {
      return "Informe a descrição.";
    }

    if (!dataValidade) {
      return "Informe a data de validade.";
    }

    if (itens.length === 0) {
      return "Adicione pelo menos um item.";
    }

    if (produtosParaSelecao.length === 0) {
      return "Cadastre ao menos um produto ativo antes de adicionar itens.";
    }

    for (let i = 0; i < itens.length; i++) {
      const item = itens[i];

      if (!item.produtoId) {
        return `Item ${i + 1}: selecione um produto.`;
      }

      if (!item.descricao.trim()) {
        return `Item ${i + 1}: informe a descrição.`;
      }

      if (item.quantidade <= 0) {
        return `Item ${i + 1}: quantidade deve ser maior que zero.`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();

    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitError(null);

    const payload = {
      descricao: descricao.trim(),
      pacienteId,
      areaId,
      dataValidade,
      observacoes: observacoes.trim(),

      itens: itens.map(
        ({
          id,
          produtoId,
          descricao: desc,
          quantidade,
          especificacoes,
        }) => ({
          ...(id ? { id } : {}),
          produtoId,
          descricao: desc.trim(),
          quantidade,
          unidade:
            produtosPorId.get(
              produtoId!,
            )?.unidade ?? "UN",
          especificacoes:
            especificacoes?.trim() ||
            undefined,
        }),
      ),
    };

    try {
      if (isEditing && cotacao) {
        await atualizarCotacao({
          id: cotacao.id,
          dados: payload,
        });

        router.push(
          `/cotacoes/${cotacao.id}`,
        );
      } else {
        const criada =
          await criarCotacao(payload);

        router.push(
          `/cotacoes/${criada.id}`,
        );
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Erro ao salvar cotação.",
      );
    }
  };

  const isSubmitting =
    isCreating || isUpdating;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          asChild
        >
          <Link href="/cotacoes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing
              ? "Editar Cotação"
              : "Nova Cotação"}
          </h1>

          <p className="text-muted-foreground">
            {isEditing
              ? "Atualize os itens e informações da cotação"
              : "Crie uma nova cotação de produtos e serviços"}
          </p>
        </div>
      </div>

      {submitError && (
        <p className="text-sm text-destructive">
          {submitError}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Dados da Cotação
          </CardTitle>

          <CardDescription>
            Informações gerais da cotação
          </CardDescription>
        </CardHeader>

        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>
                Paciente *
              </FieldLabel>

              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={
                      pacienteBusca ||
                      nomePacienteSelecionado
                    }
                    onChange={(e) => {
                      setPacienteBusca(
                        e.target.value,
                      );
                      setPacienteId("");
                    }}
                    onFocus={() => {
                      if (pacienteId) {
                        setPacienteBusca("");
                      }
                    }}
                    placeholder="Pesquisar paciente..."
                    className="pl-9 pr-9"
                  />

                  {pacienteId && (
                    <button
                      type="button"
                      onClick={
                        handleLimparPaciente
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Limpar paciente selecionado"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {pacienteBusca.trim() && (
                  <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-background shadow-md">
                    {pacientesFiltrados.length > 0 ? (
                      pacientesFiltrados.map(
                        (p) => {
                          const nome =
                            p.nome ??
                            p.nomeCompleto ??
                            "";

                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() =>
                                handleSelecionarPaciente(
                                  p.id,
                                )
                              }
                              className="flex w-full items-center px-3 py-3 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                            >
                              {nome}
                            </button>
                          );
                        },
                      )
                    ) : (
                      <p className="px-3 py-3 text-sm text-muted-foreground">
                        Nenhum paciente encontrado.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Field>

            <Field>
              <FieldLabel>
                Área *
              </FieldLabel>

              <Select
                value={areaId}
                onValueChange={setAreaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma área..." />
                </SelectTrigger>

                <SelectContent>
                  {areasAtivas.map((a) => (
                    <SelectItem
                      key={a.id}
                      value={a.id}
                    >
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel>
                Descrição *
              </FieldLabel>

              <Input
                value={descricao}
                onChange={(e) =>
                  setDescricao(
                    e.target.value,
                  )
                }
                placeholder="Descrição da cotação..."
              />
            </Field>

            <Field>
              <FieldLabel>
                Data de Validade *
              </FieldLabel>

              <Input
                type="date"
                value={dataValidade}
                onChange={(e) =>
                  setDataValidade(
                    e.target.value,
                  )
                }
              />
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel>
                Observações
              </FieldLabel>

              <Textarea
                value={observacoes}
                onChange={(e) =>
                  setObservacoes(
                    e.target.value,
                  )
                }
                placeholder="Observações gerais sobre a cotação..."
                rows={2}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Itens da Cotação
            </CardTitle>

            <CardDescription>
              {itens.length} item(ns)
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Item
          </Button>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-72 min-w-72">
                    Produto *
                  </TableHead>

                  <TableHead className="min-w-[280px]">
                    Descrição *
                  </TableHead>

                  <TableHead className="w-32 min-w-32">
                    Quantidade *
                  </TableHead>

                  <TableHead className="w-72 min-w-72">
                    Especificações
                  </TableHead>

                  <TableHead className="w-16 min-w-16" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {itens.map(
                  (item, index) => (
                    <TableRow
                      key={
                        item.id ??
                        index
                      }
                    >
                      <TableCell className="w-72 min-w-72 align-top">
                        <Select
                          value={
                            item.produtoId ||
                            ""
                          }
                          onValueChange={(
                            value,
                          ) =>
                            handleSelecionarProduto(
                              index,
                              value,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um produto..." />
                          </SelectTrigger>

                          <SelectContent>
                            {produtosParaSelecao.map(
                              (p) => (
                                <SelectItem
                                  key={p.id}
                                  value={p.id}
                                >
                                  {p.nome}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="min-w-[280px] align-top">
                        <Input
                          value={
                            item.descricao
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "descricao",
                              e.target.value,
                            )
                          }
                          placeholder="Descrição do item"
                        />
                      </TableCell>

                      <TableCell className="w-32 min-w-32 align-top">
                        <Input
                          type="number"
                          min="1"
                          value={
                            item.quantidade
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantidade",
                              parseInt(
                                e.target.value,
                              ) || 0,
                            )
                          }
                        />
                      </TableCell>

                      <TableCell className="w-72 min-w-72 align-top">
                        <Input
                          value={
                            item.especificacoes ??
                            ""
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "especificacoes",
                              e.target.value,
                            )
                          }
                          placeholder="Detalhes ou especificações..."
                        />
                      </TableCell>

                      <TableCell className="w-16 min-w-16 align-top">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemoveRow(
                              index,
                            )
                          }
                          disabled={
                            itens.length <=
                            1
                          }
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          asChild
        >
          <Link href="/cotacoes">
            Cancelar
          </Link>
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <Save className="mr-2 h-4 w-4" />

          {isSubmitting
            ? "Salvando..."
            : "Salvar"}
        </Button>
      </div>
    </div>
  );
}