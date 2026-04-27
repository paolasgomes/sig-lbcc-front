"use client";

import Link from "next/link";
import { Plus, Eye, AlertTriangle } from "lucide-react";
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
import { Empty } from "@/components/ui/empty";
import { StatusBadge } from "@/components/shared/status-badge";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { StatusCotacao } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PacienteCotacoesProps {
  pacienteId: string;
}

export function PacienteCotacoes({ pacienteId }: PacienteCotacoesProps) {
  const { getCotacoesByPaciente, getAreaById, getFornecedorById } = useData();
  const { podeVisualizarValores, podeCriarCotacao } = useAuth();
  const cotacoes = getCotacoesByPaciente(pacienteId).sort(
    (a, b) =>
      new Date(b.dataSolicitacao).getTime() - new Date(a.dataSolicitacao).getTime(),
  );

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const calcularTotal = (itens: { quantidade: number; valorUnitario: number }[]) => {
    return itens.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);
  };

  const isVencida = (dataValidade: string, status: StatusCotacao | string) => {
    const hoje = new Date().toISOString().split("T")[0];
    return (
      dataValidade < hoje || status === StatusCotacao.EXPIRADA || status === "expirada"
    );
  };

  if (!podeVisualizarValores()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cotações</CardTitle>
          <CardDescription>
            Você não tem permissão para visualizar as cotações deste paciente.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cotações</CardTitle>
          <CardDescription>Cotações vinculadas ao paciente</CardDescription>
        </div>
        {podeCriarCotacao() && (
          <Button asChild>
            <Link href={`/cotacoes/nova?pacienteId=${pacienteId}`}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Cotação
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {cotacoes.length === 0 ? (
          <Empty
            title="Nenhuma cotação registrada"
            description="As cotações vinculadas a este paciente aparecerão aqui."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotacoes.map((cotacao) => {
                const area = getAreaById(cotacao.areaAtendimentoId);
                const fornecedor = getFornecedorById(cotacao.fornecedorId);
                const vencida = isVencida(cotacao.dataValidade, cotacao.status);
                const total = calcularTotal(cotacao.itens);

                return (
                  <TableRow
                    key={cotacao.id}
                    className={vencida ? "bg-destructive/5" : ""}
                  >
                    <TableCell>{formatDate(cotacao.dataSolicitacao)}</TableCell>
                    <TableCell>{area?.nome || "-"}</TableCell>
                    <TableCell>{fornecedor?.nome || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatDate(cotacao.dataValidade)}
                        {vencida && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={cotacao.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {total.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/cotacoes/${cotacao.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver cotação</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
