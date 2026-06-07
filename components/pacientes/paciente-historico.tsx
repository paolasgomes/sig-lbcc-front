"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useHistorico } from "@/hooks/use-historico";
import {
  getHistoricoCategoria,
  getHistoricoCategoriaConfig,
  getHistoricoLink,
} from "@/lib/historico-utils";

interface PacienteHistoricoProps {
  pacienteId: string;
}

export function PacienteHistorico({ pacienteId }: PacienteHistoricoProps) {
  const { historico, isLoading, error, refetch } = useHistorico(pacienteId);

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar histórico</AlertTitle>
            <AlertDescription className="flex items-center gap-2">
              {error}
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (historico.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <Empty
            title="Nenhum registro no histórico"
            description="As ações realizadas para este paciente aparecerão aqui."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico do Paciente</CardTitle>
        <CardDescription>
          Registro de todas as ações e eventos relacionados ao paciente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 h-full w-px bg-border" />

          <div className="flex flex-col gap-6">
            {historico.map((item) => {
              const categoria = getHistoricoCategoria(item.tipoEvento);
              const config = getHistoricoCategoriaConfig(categoria);
              const Icon = config.icon;
              const link = getHistoricoLink(item.referenciaId, item.tipoEvento);

              return (
                <div key={item.id} className="relative flex gap-4 pl-10">
                  <div
                    className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full ${config.colorClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 rounded-lg border bg-card p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{item.descricao}</p>
                        <p className="text-sm text-muted-foreground">{config.label}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(item.criadoEm)}
                      </p>
                    </div>
                    {item.usuarioNome && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Por: {item.usuarioNome}
                      </p>
                    )}
                    {link && (
                      <Link
                        href={link}
                        className="mt-2 inline-block text-sm text-primary hover:underline"
                      >
                        Ver detalhes
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
