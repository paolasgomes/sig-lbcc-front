"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { usePacientes } from "@/hooks/use-pacientes";
import { StatusPaciente } from "@/types";
import { useCotacoes } from "@/hooks/use-cotacoes";
import { useAtendimentos } from "@/hooks/use-atendimentos";
import { getTipoAtendimentoLabel } from "@/lib/atendimentos-utils";
import { TIPOS_ATENDIMENTO } from "@/types";
import { isCotacaoVencida } from "@/lib/cotacoes-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Users,
  ClipboardList,
  FileText,
  Download,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function RelatoriosPage() {
  const { pacientes } = usePacientes();
  const { atendimentos } = useAtendimentos();
  const { cotacoes } = useCotacoes("todas");
  const [periodoInicio, setPeriodoInicio] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [periodoFim, setPeriodoFim] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd"),
  );

  const filtrarPorPeriodo = <
    T extends {
      data?: string;
      dataHora?: string;
      dataCriacao?: string;
      dataSolicitacao?: string;
      criadoEm?: string;
    },
  >(
    items: T[],
  ) => {
    return items.filter((item) => {
      const data =
        item.dataHora ||
        item.dataCriacao ||
        item.dataSolicitacao ||
        item.criadoEm ||
        item.data;
      if (!data) return false;
      try {
        return isWithinInterval(parseISO(data), {
          start: parseISO(periodoInicio),
          end: parseISO(periodoFim),
        });
      } catch {
        return false;
      }
    });
  };

  const atendimentosFiltrados = filtrarPorPeriodo(
    atendimentos.map((a) => ({ ...a, data: a.dataAtendimento })),
  );
  const cotacoesFiltradas = filtrarPorPeriodo(cotacoes);

  // Estatisticas de pacientes por status
  const pacientesPorStatus = [
    {
      name: "Ativos",
      value: pacientes.filter((p) => p.status === StatusPaciente.ATIVO).length,
    },
    {
      name: "Suspensos",
      value: pacientes.filter((p) => p.status === StatusPaciente.SUSPENSO).length,
    },
    {
      name: "Encerrados",
      value: pacientes.filter((p) => p.status === StatusPaciente.ENCERRADO).length,
    },
  ].filter((item) => item.value > 0);

  // Atendimentos por tipo
  const atendimentosPorTipo = TIPOS_ATENDIMENTO.map((tipo) => ({
    name: getTipoAtendimentoLabel(tipo),
    value: atendimentosFiltrados.filter((a) => a.tipo === tipo).length,
  })).filter((item) => item.value > 0);

  const cotacoesPorStatus = [
    {
      name: "Ativas",
      value: cotacoesFiltradas.filter((c) => c.ativo).length,
    },
    {
      name: "Inativas",
      value: cotacoesFiltradas.filter((c) => !c.ativo).length,
    },
    {
      name: "Vencidas",
      value: cotacoesFiltradas.filter(
        (c) => c.ativo && isCotacaoVencida(c.dataValidade),
      ).length,
    },
  ].filter((item) => item.value > 0);

  const cotacoesAtivas = cotacoesFiltradas.filter((c) => c.ativo).length;
  const cotacoesInativas = cotacoesFiltradas.filter((c) => !c.ativo).length;
  const cotacoesVencidas = cotacoesFiltradas.filter(
    (c) => c.ativo && isCotacaoVencida(c.dataValidade),
  ).length;

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor"]}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Relatorios</h1>
              <p className="text-muted-foreground">
                Visualize estatisticas e indicadores do sistema
              </p>
            </div>
          </div>

          {/* Filtro de periodo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Periodo de Analise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <Field>
                  <FieldLabel>Data Inicio</FieldLabel>
                  <Input
                    type="date"
                    value={periodoInicio}
                    onChange={(e) => setPeriodoInicio(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel>Data Fim</FieldLabel>
                  <Input
                    type="date"
                    value={periodoFim}
                    onChange={(e) => setPeriodoFim(e.target.value)}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Cards de resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pacientes.length}</div>
                <p className="text-xs text-muted-foreground">
                  {pacientes.filter((p) => p.status === StatusPaciente.ATIVO).length} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Atendimentos no Periodo
                </CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{atendimentosFiltrados.length}</div>
                <p className="text-xs text-muted-foreground">
                  no período selecionado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cotacoes no Periodo</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cotacoesFiltradas.length}</div>
                <p className="text-xs text-muted-foreground">
                  {cotacoesAtivas} ativas, {cotacoesInativas} inativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cotações Vencidas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cotacoesVencidas}</div>
                <p className="text-xs text-muted-foreground">
                  Ativas com validade expirada
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Graficos */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Atendimentos por Área
                </CardTitle>
                <CardDescription>
                  Distribuição de atendimentos por área de serviço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-75 items-center justify-center text-muted-foreground">
                  Dados por área não disponíveis para atendimentos.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pacientes por Status</CardTitle>
                <CardDescription>
                  Distribuicao atual de pacientes por status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pacientesPorStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pacientesPorStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pacientesPorStatus.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.name}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-75 items-center justify-center text-muted-foreground">
                    Nenhum paciente cadastrado.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atendimentos por Tipo</CardTitle>
                <CardDescription>Tipos de atendimentos no período</CardDescription>
              </CardHeader>
              <CardContent>
                {atendimentosPorTipo.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={atendimentosPorTipo}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {atendimentosPorTipo.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.name}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-75 items-center justify-center text-muted-foreground">
                    Nenhum atendimento no periodo selecionado.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cotacoes por Status</CardTitle>
                <CardDescription>Status das cotacoes no periodo</CardDescription>
              </CardHeader>
              <CardContent>
                {cotacoesPorStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cotacoesPorStatus} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        className="text-xs"
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="hsl(var(--chart-2))"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-75 items-center justify-center text-muted-foreground">
                    Nenhuma cotacao no periodo selecionado.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela resumo de pacientes */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo por Diagnostico</CardTitle>
              <CardDescription>
                Distribuicao de pacientes por tipo de cancer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Diagnostico</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead className="text-center">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const diagnosticos = pacientes.reduce(
                        (acc, p) => {
                          if (p.diagnostico) {
                            acc[p.diagnostico] = (acc[p.diagnostico] || 0) + 1;
                          }
                          return acc;
                        },
                        {} as Record<string, number>,
                      );

                      return Object.entries(diagnosticos)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([diagnostico, count]) => (
                          <TableRow key={diagnostico}>
                            <TableCell className="font-medium">{diagnostico}</TableCell>
                            <TableCell className="text-center">{count}</TableCell>
                            <TableCell className="text-center">
                              {((count / pacientes.length) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ));
                    })()}
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
