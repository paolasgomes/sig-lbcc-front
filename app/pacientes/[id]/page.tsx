"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Phone,
  MapPin,
  Calendar,
  User,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatusBadge } from "@/components/shared/status-badge";
import { PacienteHistorico } from "@/components/pacientes/paciente-historico";
import { PacienteAtendimentos } from "@/components/pacientes/paciente-atendimentos";
import { PacienteCotacoes } from "@/components/pacientes/paciente-cotacoes";
import { PacienteDocumentos } from "@/components/pacientes/paciente-documentos";
import { AlterarStatusModal } from "@/components/pacientes/alterar-status-modal";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Paciente } from "@/types";
import { Spinner } from "@/components/ui/spinner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PacienteDetalhePage({ params }: PageProps) {
  const { id } = use(params);
  const { getPacienteById, fetchPacienteById } = useData();
  const { podeAlterarStatus } = useAuth();
  const [paciente, setPaciente] = useState<Paciente | undefined>(() =>
    getPacienteById(id),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const pacienteLocal = getPacienteById(id);

    if (pacienteLocal) {
      setPaciente(pacienteLocal);
    }

    setIsLoading(true);
    setLoadError(null);

    void fetchPacienteById(id)
      .then((pacienteDetalhado) => {
        setPaciente(pacienteDetalhado);
      })
      .catch((error) => {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar detalhes do paciente.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading && !paciente) {
    return (
      <DashboardLayout>
        <div className="flex min-h-80 items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="h-5 w-5" />
          <span>Carregando paciente...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (loadError && !paciente) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar o paciente</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (!paciente) {
    notFound();
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {loadError && (
          <Alert variant="destructive">
            <AlertTitle>Falha ao atualizar os dados do paciente</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/pacientes">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {paciente.nomeCompleto}
                </h1>
                <StatusBadge status={paciente.status} />
              </div>
              <p className="text-muted-foreground">
                CPF: {paciente.cpf} | SUS: {paciente.numeroSUS}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {podeAlterarStatus() && (
              <AlterarStatusModal
                pacienteId={paciente.id}
                statusAtual={paciente.status}
              />
            )}
            <Button asChild>
              <Link href={`/pacientes/${paciente.id}/editar`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
            <TabsTrigger value="cotacoes">Cotações</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          {/* Dados Gerais */}
          <TabsContent value="dados" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Dados Pessoais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Dados Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                      <p className="font-medium">{formatDate(paciente.dataNascimento)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sexo</p>
                      <p className="font-medium capitalize">{paciente.sexo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado Civil</p>
                      <p className="font-medium capitalize">
                        {paciente.estadoCivil.replace("_", " ")}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Profissão</p>
                      <p className="font-medium">{paciente.profissao || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contato e Endereço */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Contato e Endereço
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{paciente.telefone}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">
                      {paciente.endereco.logradouro}, {paciente.endereco.numero}
                      {paciente.endereco.complemento &&
                        ` - ${paciente.endereco.complemento}`}
                    </p>
                    <p className="text-muted-foreground">
                      {paciente.endereco.bairro} - {paciente.endereco.cidade}/
                      {paciente.endereco.estado}
                    </p>
                    <p className="text-muted-foreground">CEP: {paciente.endereco.cep}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Dados Clínicos */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Dados Clínicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">
                      Diagnóstico Oncológico
                    </p>
                    <p className="font-medium">{paciente.diagnosticoOncologico}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Setor</p>
                    <p className="font-medium">{paciente.setor || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Área de Tratamento</p>
                    <p className="font-medium">{paciente.areaTratamento || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Início do Tratamento
                      </p>
                      <p className="font-medium">
                        {formatDate(paciente.dataInicioTratamento)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Médico Responsável</p>
                    <p className="font-medium">{paciente.medicoResponsavel || "-"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="historico" className="mt-6">
            <PacienteHistorico pacienteId={paciente.id} />
          </TabsContent>

          {/* Atendimentos */}
          <TabsContent value="atendimentos" className="mt-6">
            <PacienteAtendimentos pacienteId={paciente.id} />
          </TabsContent>

          {/* Cotações */}
          <TabsContent value="cotacoes" className="mt-6">
            <PacienteCotacoes pacienteId={paciente.id} />
          </TabsContent>

          {/* Documentos */}
          <TabsContent value="documentos" className="mt-6">
            <PacienteDocumentos pacienteId={paciente.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
