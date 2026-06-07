"use client";

import Link from "next/link";
import { Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Empty } from "@/components/ui/empty";
import { TableLoading } from "@/components/ui/table-state";
import TableActions, { TableActionLink } from "@/components/ui/table-actions";
import { useAtendimentos } from "@/hooks/use-atendimentos";
import {
  formatDataAtendimento,
  getTipoAtendimentoLabel,
} from "@/lib/atendimentos-utils";

interface PacienteAtendimentosProps {
  pacienteId: string;
}

export function PacienteAtendimentos({ pacienteId }: PacienteAtendimentosProps) {
  const { atendimentos, isLoading, error, refetch } = useAtendimentos();

  const atendimentosPaciente = atendimentos
    .filter((a) => a.pacienteId === pacienteId)
    .sort((a, b) => b.dataAtendimento.localeCompare(a.dataAtendimento));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Atendimentos</CardTitle>
          <CardDescription>Registros de atendimentos do paciente</CardDescription>
        </div>
        <Button asChild>
          <Link href={`/atendimentos/novo?pacienteId=${pacienteId}`}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Atendimento
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && <TableLoading columns={4} rows={3} />}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar atendimentos</AlertTitle>
            <AlertDescription className="flex items-center gap-2">
              {error}
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && atendimentosPaciente.length === 0 && (
          <Empty
            title="Nenhum atendimento registrado"
            description="Os atendimentos realizados para este paciente aparecerão aqui."
          />
        )}
        {!isLoading && !error && atendimentosPaciente.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-17.5">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atendimentosPaciente.map((atendimento) => (
                <TableRow key={atendimento.id}>
                  <TableCell>
                    {formatDataAtendimento(atendimento.dataAtendimento)}
                  </TableCell>
                  <TableCell>{getTipoAtendimentoLabel(atendimento.tipo)}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {atendimento.descricao}
                  </TableCell>
                  <TableCell>
                    <TableActions>
                      <TableActionLink href={`/atendimentos/${atendimento.id}`}>
                        <span className="flex items-center gap-2">
                          <Eye className="h-4 w-4" /> Ver
                        </span>
                      </TableActionLink>
                    </TableActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
