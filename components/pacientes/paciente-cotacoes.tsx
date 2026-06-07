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
import { useCotacoes } from "@/hooks/use-cotacoes";
import { useUsuario } from "@/hooks/use-usuario";
import { isCotacaoVencida, formatDateOnly } from "@/lib/cotacoes-utils";

interface PacienteCotacoesProps {
  pacienteId: string;
}

export function PacienteCotacoes({ pacienteId }: PacienteCotacoesProps) {
  const { cotacoes } = useCotacoes("todas");
  const { isGestor } = useUsuario();

  const cotacoesPaciente = cotacoes
    .filter((c) => c.pacienteId === pacienteId)
    .sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cotações</CardTitle>
          <CardDescription>Cotações vinculadas ao paciente</CardDescription>
        </div>
        {isGestor && (
          <Button asChild>
            <Link href={`/cotacoes/nova?pacienteId=${pacienteId}`}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Cotação
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {cotacoesPaciente.length === 0 ? (
          <Empty
            title="Nenhuma cotação registrada"
            description="As cotações vinculadas a este paciente aparecerão aqui."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotacoesPaciente.map((cotacao) => {
                const vencida =
                  cotacao.ativo && isCotacaoVencida(cotacao.dataValidade);

                return (
                  <TableRow
                    key={cotacao.id}
                    className={vencida ? "bg-destructive/5" : ""}
                  >
                    <TableCell className="font-medium">
                      {cotacao.descricao}
                    </TableCell>
                    <TableCell>{cotacao.areaNome ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatDateOnly(cotacao.dataValidade)}
                        {vencida && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={cotacao.ativo ? "ativo" : "inativo"}
                      />
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
