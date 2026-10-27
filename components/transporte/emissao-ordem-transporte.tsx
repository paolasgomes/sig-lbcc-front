
"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Download,
  FileText,
  Loader2,
  Plus,
} from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  baixarPdfVoucherTransporte,
  type OrdemTransporte,
  type VoucherTransporte,
} from "@/services/transporte-service";

import {
  useEmitirOrdemTransporte,
  useEmitirSegundaViaVoucher,
  useRegistrarEntregaVoucher,
  useVouchersTransporte,
  useOrdensDeTransporte,
} from "@/hooks/use-transporte";

interface EmissaoOrdemTransporteProps {
  cotacaoId: string;
  bloqueada?: boolean;
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
          data?: {
            erro?: string;
            message?: string;
          };
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

export function EmissaoOrdemTransporte({
  cotacaoId,
  bloqueada = false,
}: EmissaoOrdemTransporteProps) {
  const [veiculoPlaca, setVeiculoPlaca] = useState("");
  const [tipoCombustivel, setTipoCombustivel] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [posto, setPosto] = useState("");
  const [validade, setValidade] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [ordem, setOrdem] = useState<OrdemTransporte | null>(null);
  const [vouchers, setVouchers] = useState<VoucherTransporte[]>([]);
  const [destinatarios, setDestinatarios] = useState<
    Record<string, string>
  >({});
  const [voucherEmProcessamento, setVoucherEmProcessamento] =
    useState<string | null>(null);
  const [erro, setErro] = useState("");

  const { emitirOrdem, isEmitting } = useEmitirOrdemTransporte();

  const {
    ordens,
    isLoading: carregandoOrdens,
    error: erroAoCarregarOrdens,
    refetch: recarregarOrdens,
  } = useOrdensDeTransporte();

  const ordemEncontrada = ordens.find(
    (item) => item.cotacao_id === cotacaoId,
  );

  const {
    vouchers: vouchersSalvos,
    isLoading: carregandoVouchers,
    error: erroAoCarregarVouchers,
    refetch: recarregarVouchers,
  } = useVouchersTransporte(ordem?.id ?? "");

  const { emitirSegundaVia, isEmitting: isEmittingSecondCopy } =
    useEmitirSegundaViaVoucher();

  const { registrarEntrega, isRegistering } =
    useRegistrarEntregaVoucher();



  useEffect(() => {
    if (!ordemEncontrada) return;

    if (ordemEncontrada.status === "pendente") {
      setVeiculoPlaca(ordemEncontrada.veiculo_placa ?? "");
      setTipoCombustivel(ordemEncontrada.tipo_combustivel ?? "");
      setQuantidade(
        ordemEncontrada.quantidade_autorizada?.toString() ?? "",
      );
      setPosto(ordemEncontrada.posto_abastecimento ?? "");
      setValidade(ordemEncontrada.validade_ate?.slice(0, 10) ?? "");
      setObservacoes(ordemEncontrada.observacoes ?? "");
      return;
    }

    setOrdem((atual) =>
      atual?.id === ordemEncontrada.id ? atual : ordemEncontrada,
    );
  }, [ordemEncontrada]);

  useEffect(() => {
    if (!ordem || vouchersSalvos.length === 0) return;

    setVouchers(vouchersSalvos);
  }, [ordem, vouchersSalvos]);


  async function handleEmitir(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErro("");


    // Confere novamente se já existe uma ordem para esta cotação.
    // Evita emitir outra OT com base em uma lista desatualizada.
    const resultadoConsulta = await recarregarOrdens();
    const ordemAtual = (resultadoConsulta.data ?? []).find(
      (item) => item.cotacao_id === cotacaoId,
    );

    if (ordemAtual && ordemAtual.status !== "pendente") {
      setOrdem(ordemAtual);
      setErro(
        "Esta cotação já possui uma Ordem de Transporte emitida.",
      );
      toast.error(
        "A cotação já possui uma Ordem de Transporte emitida.",
      );
      return;
    }

    try {
      const resultado = await emitirOrdem({
        cotacao_id: cotacaoId,
        veiculo_placa: veiculoPlaca.trim() || undefined,
        tipo_combustivel: tipoCombustivel.trim(),
        quantidade_autorizada: Number(quantidade),
        posto_abastecimento: posto.trim(),
        validade_ate: validade,
        observacoes: observacoes.trim() || undefined,
      });

      setOrdem(resultado);
      setVouchers(resultado.vouchers ?? []);

      toast.success(
        "Ordem de Transporte emitida com sucesso.",
      );

      await recarregarOrdens();

      if (resultado.id) {
        await recarregarVouchers();
      }
    } catch (error) {
      const mensagem = mensagemErro(error);
      setErro(mensagem);
      toast.error(mensagem);
    }
  }

  async function handleBaixarPdf(
    voucher: VoucherTransporte,
  ) {
    if (!ordem) return;

    setVoucherEmProcessamento(voucher.id);
    setErro("");

    try {
      const resultado = await baixarPdfVoucherTransporte(
        ordem.id,
        voucher.id,
      );

      const url = URL.createObjectURL(resultado.blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = resultado.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("Download do voucher iniciado.");
    } catch (error) {
      const mensagem = mensagemErro(error);
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setVoucherEmProcessamento(null);
    }
  }

  async function handleRegistrarEntrega(
    voucher: VoucherTransporte,
  ) {
    if (!ordem) return;

    const destinatario = (
      destinatarios[voucher.id] ?? ""
    ).trim();

    if (!destinatario) {
      toast.error(
        "Informe o nome de quem recebeu o voucher.",
      );
      return;
    }

    setVoucherEmProcessamento(voucher.id);
    setErro("");

    try {
      await registrarEntrega({
        ordemId: ordem.id,
        voucherId: voucher.id,
        destinatario,
      });

      await recarregarVouchers();

      setVouchers((atuais) =>
        atuais.map((item) =>
          item.id === voucher.id
            ? {
                ...item,
                destinatario,
                entregue_em: new Date().toISOString(),
              }
            : item,
        ),
      );

      toast.success("Entrega do voucher registrada.");
    } catch (error) {
      const mensagem = mensagemErro(error);
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setVoucherEmProcessamento(null);
    }
  }

  async function handleSegundaVia() {
    if (!ordem) return;

    setErro("");

    try {
      const resultado = await emitirSegundaVia(ordem.id);

      if (!resultado.voucher) {
        throw new Error(
          "A API não retornou os dados do voucher da segunda via.",
        );
      }

      setVouchers((atuais) => [
        ...atuais,
        resultado.voucher as VoucherTransporte,
      ]);

      await recarregarVouchers();

      toast.success("Segunda via emitida com sucesso.");
    } catch (error) {
      const mensagem = mensagemErro(error);
      setErro(mensagem);
      toast.error(mensagem);
    }
  }

  if (bloqueada) {
    return null;
  }

  if (carregandoOrdens) {
    return (
      <section className="rounded-lg border p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verificando Ordens de Transporte existentes...
        </div>
      </section>
    );
  }

  if (erroAoCarregarOrdens) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          Não foi possível verificar a ordem
        </AlertTitle>
        <AlertDescription>
          Atualize a página ou tente novamente antes de emitir
          uma OT.
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => void recarregarOrdens()}
            >
              Tentar novamente
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  const vouchersExibidos =
    vouchersSalvos.length > 0 ? vouchersSalvos : vouchers;

  return (
    <section className="space-y-5 rounded-lg border p-5">
      <div>
        <h2 className="text-lg font-semibold">
          Ordem de Transporte
        </h2>
        <p className="text-sm text-muted-foreground">
          Emita a ordem e gerencie os vouchers vinculados à
          cotação.
        </p>
      </div>

      {erro && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro na operação</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {!ordem ? (
        <form onSubmit={handleEmitir} className="space-y-4">
          {ordemEncontrada?.status === "pendente" && (
            <Alert>
              <AlertTitle>
                Ordem de Transporte criada
              </AlertTitle>
              <AlertDescription>
                Já existe uma OT pendente para esta cotação.
                Confira os dados e emita a ordem para gerar o
                voucher.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ot-placa">
                Placa do veículo (opcional)
              </Label>
              <Input
                id="ot-placa"
                value={veiculoPlaca}
                onChange={(event) =>
                  setVeiculoPlaca(
                    event.target.value.toUpperCase(),
                  )
                }
                maxLength={10}
                placeholder="ABC1D23"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ot-combustivel">
                Tipo de combustível *
              </Label>
              <Input
                id="ot-combustivel"
                value={tipoCombustivel}
                onChange={(event) =>
                  setTipoCombustivel(event.target.value)
                }
                required
                placeholder="Ex.: Gasolina"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ot-quantidade">
                Quantidade autorizada *
              </Label>
              <Input
                id="ot-quantidade"
                type="number"
                min="0.01"
                step="any"
                value={quantidade}
                onChange={(event) =>
                  setQuantidade(event.target.value)
                }
                required
                placeholder="Ex.: 30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ot-posto">
                Posto de abastecimento *
              </Label>
              <Input
                id="ot-posto"
                value={posto}
                onChange={(event) =>
                  setPosto(event.target.value)
                }
                required
                placeholder="Nome do posto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ot-validade">
                Validade do voucher *
              </Label>
              <Input
                id="ot-validade"
                type="date"
                value={validade}
                onChange={(event) =>
                  setValidade(event.target.value)
                }
                min={new Date().toLocaleDateString("en-CA")}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ot-observacoes">
              Observações (opcional)
            </Label>
            <Textarea
              id="ot-observacoes"
              value={observacoes}
              onChange={(event) =>
                setObservacoes(event.target.value)
              }
              maxLength={1000}
              placeholder="Informações adicionais"
            />
          </div>

          <Button type="submit" disabled={isEmitting}>
            {isEmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            {isEmitting
              ? "Emitindo..."
              : "Emitir Ordem de Transporte"}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md bg-muted p-4 text-sm">
            <p>
              <strong>Ordem:</strong> {ordem.numero}
            </p>
            <p>
              <strong>Status:</strong> {ordem.status}
            </p>
            <p>
              <strong>Posto:</strong>{" "}
              {ordem.posto_abastecimento ?? "Não informado"}
            </p>
            <p>
              <strong>Validade:</strong>{" "}
              {ordem.validade_ate ?? "Não informada"}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">
              Vouchers emitidos
            </h3>

            {carregandoVouchers ? (
              <p className="text-sm text-muted-foreground">
                Carregando vouchers...
              </p>
            ) : erroAoCarregarVouchers ? (
              <Alert variant="destructive">
                <AlertTitle>
                  Não foi possível carregar os vouchers
                </AlertTitle>
                <AlertDescription>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void recarregarVouchers()}
                  >
                    Tentar novamente
                  </Button>
                </AlertDescription>
              </Alert>
            ) : vouchersExibidos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum voucher encontrado para esta ordem.
              </p>
            ) : (
              vouchersExibidos.map((voucher) => {
                const processando =
                  voucherEmProcessamento === voucher.id;
                const entregue = Boolean(voucher.entregue_em);

                return (
                  <div
                    key={voucher.id}
                    className="space-y-3 rounded-md border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {voucher.tipo_via === "original"
                            ? "Via original"
                            : "Segunda via"}{" "}
                          — via {voucher.numero_via}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Código: {voucher.codigo}
                        </p>
                        <p className="text-sm">
                          {entregue
                            ? `Entregue a: ${
                                voucher.destinatario ??
                                "Destinatário informado"
                              }`
                            : "Entrega ainda não registrada"}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        disabled={processando}
                        onClick={() =>
                          void handleBaixarPdf(voucher)
                        }
                      >
                        {processando ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Baixar PDF
                      </Button>
                    </div>

                    {!entregue && (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={destinatarios[voucher.id] ?? ""}
                          onChange={(event) =>
                            setDestinatarios((atuais) => ({
                              ...atuais,
                              [voucher.id]: event.target.value,
                            }))
                          }
                          placeholder="Nome de quem recebeu"
                          aria-label="Nome de quem recebeu o voucher"
                        />
                        <Button
                          type="button"
                          disabled={processando || isRegistering}
                          onClick={() =>
                            void handleRegistrarEntrega(voucher)
                          }
                        >
                          Registrar entrega
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isEmittingSecondCopy}
            onClick={() => void handleSegundaVia()}
          >
            {isEmittingSecondCopy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Emitir segunda via
          </Button>
        </div>
      )}
    </section>
  );
}
