
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, RefreshCw, Save, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useAtualizarOrdemDeTransporte,
  useOrdensDeTransporte,
} from "@/hooks/use-transporte";
import type {
  AtualizarOrdemTransporteInput,
  OrdemTransporte,
} from "@/services/transporte-service";
import { useAuth } from "@/contexts/auth-context";

type CamposEdicao = {
  veiculo_placa: string;
  tipo_combustivel: string;
  quantidade_autorizada: string;
  posto_abastecimento: string;
  validade_ate: string;
  observacoes: string;
};

function camposDaOrdem(ordem: OrdemTransporte): CamposEdicao {
  return {
    veiculo_placa: ordem.veiculo_placa ?? "",
    tipo_combustivel: ordem.tipo_combustivel ?? "",
    quantidade_autorizada:
      ordem.quantidade_autorizada == null
        ? ""
        : String(ordem.quantidade_autorizada),
    posto_abastecimento: ordem.posto_abastecimento ?? "",
    validade_ate: ordem.validade_ate?.slice(0, 10) ?? "",
    observacoes: ordem.observacoes ?? "",
  };
}

function mensagemErro(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: { erro?: string; message?: string };
        };
      }
    ).response;

    return (
      response?.data?.erro ??
      response?.data?.message ??
      "Não foi possível concluir a operação."
    );
  }

  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

function formatarStatus(status: string): string {
  const nomes: Record<string, string> = {
    pendente: "Pendente",
    emitida: "Emitida",
    finalizada: "Finalizada",
    cancelada: "Cancelada",
  };

  return nomes[status.toLowerCase()] ?? status;
}

export function ListaOrdensTransporte() {
  const { usuario } = useAuth();
  const { ordens, isLoading, error, refetch } =
    useOrdensDeTransporte();
  const {
    atualizarOrdem,
    isUpdating,
  } = useAtualizarOrdemDeTransporte();

  const [ordemEditando, setOrdemEditando] =
    useState<OrdemTransporte | null>(null);
  const [campos, setCampos] = useState<CamposEdicao | null>(null);
  const [erroFormulario, setErroFormulario] = useState("");

  const ehGestor = usuario?.perfil === "gestor";

  function iniciarEdicao(ordem: OrdemTransporte) {
    setOrdemEditando(ordem);
    setCampos(camposDaOrdem(ordem));
    setErroFormulario("");
  }

  function cancelarEdicao() {
    setOrdemEditando(null);
    setCampos(null);
    setErroFormulario("");
  }

  function atualizarCampo<K extends keyof CamposEdicao>(
    campo: K,
    valor: CamposEdicao[K],
  ) {
    setCampos((atuais) =>
      atuais ? { ...atuais, [campo]: valor } : atuais,
    );
  }

  async function salvarEdicao(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ordemEditando || !campos) return;

    setErroFormulario("");

    const quantidadeTexto = campos.quantidade_autorizada.trim();
    const quantidade = quantidadeTexto
      ? Number(quantidadeTexto)
      : null;

    if (
      quantidade !== null &&
      (!Number.isFinite(quantidade) || quantidade <= 0)
    ) {
      setErroFormulario("A quantidade autorizada deve ser maior que zero.");
      return;
    }

    const dados: Partial<AtualizarOrdemTransporteInput> = {
      veiculo_placa: campos.veiculo_placa.trim() || null,
      tipo_combustivel: campos.tipo_combustivel.trim() || null,
      quantidade_autorizada: quantidade,
      posto_abastecimento: campos.posto_abastecimento.trim() || null,
      validade_ate: campos.validade_ate || null,
      observacoes: campos.observacoes.trim() || null,
    };

    try {
      await atualizarOrdem({
        id: ordemEditando.id,
        dados,
      });

      toast.success("Ordem de Transporte atualizada.");
      cancelarEdicao();
      await refetch();
    } catch (error) {
      const mensagem = mensagemErro(error);
      setErroFormulario(mensagem);
      toast.error(mensagem);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando Ordens de Transporte...</p>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Não foi possível carregar as Ordens de Transporte.
          Verifique sua conexão e tente novamente.
        </AlertDescription>
        <Button variant="outline" onClick={() => void refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Ordens de Transporte</h2>
          <p className="text-sm text-muted-foreground">
            Ordens geradas a partir das cotações de transporte urbano.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void refetch()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {ordemEditando && campos && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={salvarEdicao} className="space-y-4">
              <h3 className="font-semibold">
                Editar ordem {ordemEditando.numero}
              </h3>

              {erroFormulario && (
                <Alert variant="destructive">
                  <AlertDescription>{erroFormulario}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ot-placa">Placa do veículo</Label>
                  <Input
                    id="ot-placa"
                    value={campos.veiculo_placa}
                    onChange={(e) =>
                      atualizarCampo("veiculo_placa", e.target.value.toUpperCase())
                    }
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ot-combustivel">Tipo de combustível</Label>
                  <Input
                    id="ot-combustivel"
                    value={campos.tipo_combustivel}
                    onChange={(e) =>
                      atualizarCampo("tipo_combustivel", e.target.value)
                    }
                    placeholder="Ex.: Gasolina"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ot-quantidade">Quantidade autorizada</Label>
                  <Input
                    id="ot-quantidade"
                    type="number"
                    min="0.01"
                    step="any"
                    value={campos.quantidade_autorizada}
                    onChange={(e) =>
                      atualizarCampo("quantidade_autorizada", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ot-posto">Posto de abastecimento</Label>
                  <Input
                    id="ot-posto"
                    value={campos.posto_abastecimento}
                    onChange={(e) =>
                      atualizarCampo("posto_abastecimento", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ot-validade">Validade</Label>
                  <Input
                    id="ot-validade"
                    type="date"
                    value={campos.validade_ate}
                    onChange={(e) =>
                      atualizarCampo("validade_ate", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ot-observacoes">Observações</Label>
                  <Input
                    id="ot-observacoes"
                    value={campos.observacoes}
                    onChange={(e) =>
                      atualizarCampo("observacoes", e.target.value)
                    }
                    maxLength={1000}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isUpdating}>
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdating ? "Salvando..." : "Salvar alterações"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={cancelarEdicao}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {ordens.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma Ordem de Transporte encontrada.
              Quando uma cotação de transporte urbano tiver o vencedor confirmado,
              a ordem deverá aparecer aqui.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cotação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Combustível</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Posto</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {ordens.map((ordem) => (
                    <TableRow key={ordem.id}>
                      <TableCell className="font-medium">
                        {ordem.numero}
                      </TableCell>
                      <TableCell>{ordem.cotacao_id}</TableCell>
                      <TableCell>{formatarStatus(ordem.status)}</TableCell>
                      <TableCell>{ordem.veiculo_placa ?? "-"}</TableCell>
                      <TableCell>{ordem.tipo_combustivel ?? "-"}</TableCell>
                      <TableCell>
                        {ordem.quantidade_autorizada ?? "-"}
                      </TableCell>
                      <TableCell>{ordem.posto_abastecimento ?? "-"}</TableCell>
                      <TableCell>
                        {ehGestor && ordem.status.toLowerCase() === "pendente" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => iniciarEdicao(ordem)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {ordem.status.toLowerCase() === "pendente"
                              ? "Somente gestor pode editar"
                              : "Edição indisponível"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
