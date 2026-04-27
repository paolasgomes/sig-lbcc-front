"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { PerfilUsuario } from "@/types";
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
import { StatusBadge } from "@/components/shared/status-badge";
import {
  ArrowLeft,
  Pencil,
  FileText,
  User,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CotacaoDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CotacaoDetailPage({ params }: CotacaoDetailPageProps) {
  const { id } = use(params);
  const { cotacoes, pacientes, produtos, fornecedores, updateCotacao } = useData();
  const { user } = useAuth();
  const cotacao = cotacoes.find((c) => c.id === id);

  if (!cotacao) {
    notFound();
  }

  const paciente = pacientes.find((p) => p.id === cotacao.pacienteId);

  const getProdutoNome = (produtoId?: string) => {
    if (!produtoId) return "Produto nao encontrado";
    const produto = produtos.find((p) => p.id === produtoId);
    return produto?.nome || "Produto nao encontrado";
  };

  const getProdutoUnidade = (produtoId?: string) => {
    if (!produtoId) return "";
    const produto = produtos.find((p) => p.id === produtoId);
    return produto?.unidade || "";
  };

  const getFornecedorNome = (fornecedorId?: string) => {
    if (!fornecedorId) return "-";
    const fornecedor = fornecedores.find((f) => f.id === fornecedorId);
    return fornecedor?.nomeFantasia || "-";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const calcularValorTotal = () => {
    return cotacao.itens.reduce(
      (total, item) => total + item.quantidade * item.valorUnitario,
      0,
    );
  };

  const valorTotal = calcularValorTotal();

  const handleAprovar = () => {
    if (confirm("Tem certeza que deseja aprovar esta cotacao?")) {
      updateCotacao(cotacao.id, {
        status: "aprovada",
        dataAprovacao: new Date().toISOString(),
        aprovadoPor: user?.id,
      });
    }
  };

  const handleReprovar = () => {
    if (confirm("Tem certeza que deseja reprovar esta cotacao?")) {
      updateCotacao(cotacao.id, { status: "reprovada" });
    }
  };

  const canApproveByPerfil =
    (user?.perfil === PerfilUsuario.OPERADOR || user?.perfil === PerfilUsuario.GESTOR) &&
    (cotacao.status === "enviada" || cotacao.status === "em_analise");

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor", "atendente"]}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/cotacoes">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">
                    Cotacao #{cotacao.id.slice(0, 8).toUpperCase()}
                  </h1>
                  <StatusBadge status={cotacao.status} type="cotacao" />
                </div>
                <p className="text-muted-foreground">
                  Solicitada em{" "}
                  {format(new Date(cotacao.dataSolicitacao), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {cotacao.status === "rascunho" && (
                <Button variant="outline" asChild>
                  <Link href={`/cotacoes/${cotacao.id}/editar`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </Button>
              )}
              {canApproveByPerfil && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleReprovar}
                    className="text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reprovar
                  </Button>
                  <Button onClick={handleAprovar}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprovar
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Paciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paciente ? (
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/pacientes/${paciente.id}`}
                      className="font-medium hover:underline"
                    >
                      {paciente.nome ?? paciente.nomeCompleto}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      CPF:{" "}
                      {paciente.cpf.replace(
                        /(\d{3})(\d{3})(\d{3})(\d{2})/,
                        "$1.$2.$3-$4",
                      )}
                    </p>
                    {paciente.telefone && (
                      <p className="text-sm text-muted-foreground">
                        Tel: {paciente.telefone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Paciente nao encontrado</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informacoes
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data de Criacao:</span>
                  <span>
                    {format(
                      new Date(cotacao.dataCriacao ?? cotacao.dataSolicitacao),
                      "dd/MM/yyyy HH:mm",
                    )}
                  </span>
                </div>
                {cotacao.dataAprovacao && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data de Aprovacao:</span>
                    <span>
                      {format(new Date(cotacao.dataAprovacao), "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Itens:</span>
                  <span>{cotacao.itens.length}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Valor Total:</span>
                  <span className="font-mono">
                    {formatCurrency(cotacao.valorTotal ?? valorTotal)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {cotacao.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observacoes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{cotacao.observacoes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Itens da Cotacao
              </CardTitle>
              <CardDescription>
                {cotacao.itens.length} item(ns) incluido(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Preco Unitario</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cotacao.itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {getProdutoNome(item.produtoId)}
                            </p>
                            {item.observacao && (
                              <p className="text-xs text-muted-foreground">
                                {item.observacao}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantidade} {getProdutoUnidade(item.produtoId)}
                        </TableCell>
                        <TableCell>{getFornecedorNome(item.fornecedorId)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(item.precoUnitario ?? item.valorUnitario)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(
                            (item.precoUnitario ?? item.valorUnitario) * item.quantidade,
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={4} className="text-right font-semibold">
                        Total:
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-lg">
                        {formatCurrency(cotacao.valorTotal ?? valorTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
