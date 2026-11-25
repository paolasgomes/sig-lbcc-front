
"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useRelatorioPorPeriodo } from "@/hooks/use-relatorios";
import { isCotacaoVencida } from "@/lib/cotacoes-utils";
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
  TrendingUp,
  Calendar,
  Truck,
  Package,
  AlertTriangle,
  Ban,
  Printer,
  FileDown,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
} from "date-fns";
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
} from "recharts";
import { Button } from "@/components/ui/button";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#eab308",
  "#9333ea",
  "#ea580c",
  "#dc2626",
];

const STATUS_LABELS: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  pronta_para_analise: "Pronta para análise",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
  rascunho: "Rascunho",
  enviada: "Enviada",
  aprovada: "Aprovada",
  recusada: "Recusada",
  pendente: "Pendente",
  normal: "Normal",
};

const TIPO_ATENDIMENTO_LABELS: Record<string, string> = {
  consulta: "Consulta",
  exame: "Exame",
  internacao: "Internação",
  cirurgia: "Cirurgia",
  retorno: "Retorno",
  outro: "Outro",
};

const formatarMoeda = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatarData = (data: string) => {
  if (!data) return "—";

  return format(new Date(`${data}T00:00:00`), "dd/MM/yyyy");
};

export default function RelatoriosPage() {
  const [periodoInicio, setPeriodoInicio] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  );

  const [periodoFim, setPeriodoFim] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd"),
  );

  const {
    data: relatorio,
    isLoading,
    isError,
    error,
  } = useRelatorioPorPeriodo(periodoInicio, periodoFim);

  const resumo = relatorio?.resumo;

  const atendimentos = relatorio?.atendimentos ?? [];
  const cotacoes = relatorio?.cotacoes ?? [];
  const ordensFornecimento = relatorio?.ordens_fornecimento ?? [];
  const ordensTransporte = relatorio?.ordens_transporte ?? [];
  const divergencias = relatorio?.divergencias ?? [];
  const cancelamentos = relatorio?.cancelamentos ?? [];

  const cotacoesAtivas = cotacoes.filter(
    (cotacao) => cotacao.status !== "cancelada",
  ).length;

  const cotacoesCanceladas = cotacoes.filter(
    (cotacao) => cotacao.status === "cancelada",
  ).length;

  const cotacoesVencidas = cotacoes.filter(
    (cotacao) =>
      cotacao.status !== "cancelada" &&
      isCotacaoVencida(cotacao.data_validade),
  ).length;

  const atendimentosPorTipo = Object.entries(
    atendimentos.reduce<Record<string, number>>((acc, atendimento) => {
      const tipo = atendimento.tipo || "nao_informado";
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({
    name: TIPO_ATENDIMENTO_LABELS[name] || name,
    value,
  }));

  const atendimentosPorArea = Object.entries(
    atendimentos.reduce<Record<string, number>>((acc, atendimento) => {
      const area = atendimento.areas?.nome || "Não informada";
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const cotacoesPorStatus = Object.entries(
    cotacoes.reduce<Record<string, number>>((acc, cotacao) => {
      const status = cotacao.status || "nao_informado";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({
    name: STATUS_LABELS[name] || name,
    value,
  }));

  const ordensPorStatus = Object.entries(
    [...ordensFornecimento, ...ordensTransporte].reduce<
      Record<string, number>
    >((acc, ordem) => {
      const status = ordem.status || "nao_informado";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({
    name: STATUS_LABELS[name] || name,
    value,
  }));

  const valorFornecimento = Number(
    resumo?.valor_total_fornecimento ?? 0,
  );

  const valorTransporte = Number(
    resumo?.valor_total_transporte ?? 0,
  );

  const valorTotal = valorFornecimento + valorTransporte;
  const normalizarCoresParaPDF = (documento: Document) => {
  const canvas = documento.createElement("canvas");
  const contexto = canvas.getContext("2d");

  if (!contexto) return;

  const elementos: HTMLElement[] = [
  documento.documentElement,
  documento.body,
  ...Array.from(documento.querySelectorAll<HTMLElement>("*")),
];

  const propriedades = [
    "color",
    "background-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline-color",
    "text-decoration-color",
  ];

  const converterCor = (valor: string) => {
    if (!/(lab|lch|oklab|oklch|color-mix)\(/i.test(valor)) {
      return valor;
    }

    contexto.fillStyle = "#000000";
    contexto.fillStyle = valor;

    return contexto.fillStyle;
  };

  elementos.forEach((elemento) => {
    const estilo = documento.defaultView?.getComputedStyle(elemento);

    if (!estilo) return;

    propriedades.forEach((propriedade) => {
      const valor = estilo.getPropertyValue(propriedade);

      if (valor) {
        elemento.style.setProperty(
          propriedade,
          converterCor(valor),
          "important"
        );
      }
    });

    const imagemFundo = estilo.backgroundImage;

    if (/(lab|lch|oklab|oklch|color-mix)\(/i.test(imagemFundo)) {
      elemento.style.setProperty("background-image", "none", "important");
    }
  });
};

const handleExportarPDF = async () => {
  try {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const azul = [23, 54, 93] as [number, number, number];
    const cinza = [241, 245, 249] as [number, number, number];

    let y = 18;

    // Cabeçalho institucional
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...azul);
    doc.text("LIGA DE BATAGUASSU CONTRA O CÂNCER", 105, y, {
      align: "center",
    });

    y += 8;
    doc.setFontSize(12);
    doc.text("RELATÓRIO CONSOLIDADO POR PERÍODO", 105, y, {
      align: "center",
    });

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "SIG-LBCC — Sistema de Gestão da Liga de Bataguassu Contra o Câncer",
      105,
      y,
      { align: "center" },
    );

    y += 4;
    doc.setDrawColor(...azul);
    doc.setLineWidth(0.8);
    doc.line(14, y, 196, y);

    y += 9;
    doc.setFillColor(238, 242, 247);
    doc.rect(14, y - 5, 182, 16, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    doc.text(
      `Período analisado: ${formatarData(periodoInicio)} até ${formatarData(periodoFim)}`,
      18,
      y + 1,
    );

    doc.setFont("helvetica", "normal");
    doc.text(
      `Data de geração: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
      18,
      y + 6,
    );

    y += 18;

    // Cria uma seção com tabela e controla a paginação.
    const adicionarSecao = (
      titulo: string,
      cabecalho: string[],
      linhas: string[][],
    ) => {
      if (y > 255) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...azul);
      doc.text(titulo, 14, y);

      y += 3;

      autoTable(doc, {
        startY: y,
        head: [cabecalho],
        body: linhas,
        theme: "grid",
        margin: { left: 14, right: 14 },
        headStyles: {
          fillColor: azul,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [31, 41, 55],
          cellPadding: 2.5,
          overflow: "linebreak",
        },
        alternateRowStyles: {
          fillColor: cinza,
        },
        styles: {
          lineColor: [203, 213, 225],
          lineWidth: 0.2,
          valign: "middle",
        },
        rowPageBreak: "avoid",
      });

      y = (doc as typeof doc & {
        lastAutoTable: { finalY: number };
      }).lastAutoTable.finalY + 9;
    };

    const adicionarObservacao = (texto: string) => {
      const linhas = doc.splitTextToSize(texto, 180);

      if (y + linhas.length * 4 > 275) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(linhas, 14, y);

      y += linhas.length * 4 + 4;
    };

    // 1. Indicadores gerais
    adicionarSecao("1. Indicadores gerais", ["Indicador", "Quantidade"], [
      ["Pacientes com atendimentos", String(resumo?.total_pacientes ?? 0)],
      ["Atendimentos realizados", String(resumo?.total_atendimentos ?? 0)],
      ["Cotações", String(resumo?.total_cotacoes ?? 0)],
      ["Cotações ativas", String(cotacoesAtivas)],
      ["Cotações canceladas", String(cotacoesCanceladas)],
      ["Cotações vencidas", String(cotacoesVencidas)],
      [
        "Ordens de fornecimento",
        String(resumo?.total_ordens_fornecimento ?? 0),
      ],
      [
        "Ordens de transporte",
        String(resumo?.total_ordens_transporte ?? 0),
      ],
      ["Divergências identificadas", String(resumo?.total_divergencias ?? 0)],
      [
        "Cancelamentos aprovados",
        String(resumo?.total_cancelamentos_aprovados ?? 0),
      ],
    ]);

    // 2. Indicadores financeiros
    adicionarSecao("2. Indicadores financeiros", ["Descrição", "Valor"], [
      ["Valor total de fornecimento", formatarMoeda(valorFornecimento)],
      ["Valor total de transporte", formatarMoeda(valorTransporte)],
      ["Valor geral", formatarMoeda(valorTotal)],
    ]);

    if (resumo?.valor_total_geral_parcial) {
      adicionarObservacao(
        "Observação: o valor geral é parcial, pois existem ordens de transporte sem valor calculado.",
      );
    }

    if (resumo?.ordens_transporte_sem_valor_calculado) {
      adicionarObservacao(
        `Ordens de transporte sem valor calculado: ${resumo.ordens_transporte_sem_valor_calculado}.`,
      );
    }

    // 3. Atendimentos por área
    adicionarSecao(
      "3. Atendimentos por área",
      ["Área", "Quantidade"],
      atendimentosPorArea.length
        ? atendimentosPorArea.map((item) => [
            String(item.name),
            String(item.value),
          ])
        : [["Nenhum registro no período.", "—"]],
    );

    // 4. Atendimentos por tipo
    adicionarSecao(
      "4. Atendimentos por tipo",
      ["Tipo de atendimento", "Quantidade"],
      atendimentosPorTipo.length
        ? atendimentosPorTipo.map((item) => [
            String(item.name),
            String(item.value),
          ])
        : [["Nenhum registro no período.", "—"]],
    );

    // 5. Cotações por situação
    adicionarSecao(
      "5. Cotações por situação",
      ["Status", "Quantidade"],
      cotacoesPorStatus.length
        ? cotacoesPorStatus.map((item) => [
            String(item.name),
            String(item.value),
          ])
        : [["Nenhuma cotação no período.", "—"]],
    );

    // 6. Ordens por situação
    adicionarSecao(
      "6. Ordens por situação",
      ["Status", "Quantidade"],
      ordensPorStatus.length
        ? ordensPorStatus.map((item) => [
            String(item.name),
            String(item.value),
          ])
        : [["Nenhuma ordem no período.", "—"]],
    );

    // 7. Divergências
    adicionarSecao(
      "7. Divergências registradas",
      ["Tipo", "Descrição", "Identificada em", "Status"],
      divergencias.length
        ? divergencias.map((item) => [
            String(item.tipo || "—"),
            String(item.descricao || "—"),
            item.identificado_em
              ? format(
                  new Date(item.identificado_em),
                  "dd/MM/yyyy HH:mm",
                )
              : "—",
            String(STATUS_LABELS[item.status] || item.status || "—"),
          ])
        : [["Nenhuma divergência registrada.", "—", "—", "—"]],
    );

    // 8. Cancelamentos
    adicionarSecao(
      "8. Solicitações de cancelamento",
      [
        "Tipo de ordem",
        "Motivo",
        "Solicitado em",
        "Status",
        "Necessidade do paciente",
      ],
      cancelamentos.length
        ? cancelamentos.map((item) => [
            item.ordem_fornecimento_id
              ? "Fornecimento"
              : item.ordem_transporte_id
                ? "Transporte"
                : "—",
            String(item.motivo || "—"),
            item.solicitado_em
              ? format(new Date(item.solicitado_em), "dd/MM/yyyy HH:mm")
              : "—",
            String(STATUS_LABELS[item.status] || item.status || "—"),
            item.necessidade_paciente === "continua"
              ? "Continua"
              : item.necessidade_paciente === "encerrada"
                ? "Encerrada"
                : "—",
          ])
        : [["Nenhum cancelamento registrado.", "—", "—", "—", "—"]],
    );

    // Rodapé em todas as páginas
    const totalPaginas = doc.getNumberOfPages();

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      doc.setPage(pagina);

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(14, 283, 196, 283);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);

      doc.text(
        "SIG-LBCC — Documento gerado eletronicamente para consulta e controle interno.",
        105,
        288,
        { align: "center" },
      );

      doc.text(
        `Página ${pagina} de ${totalPaginas}`,
        196,
        293,
        { align: "right" },
      );
    }

    doc.save(`Relatorio_${periodoInicio}_${periodoFim}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    alert("Não foi possível gerar o PDF. Verifique o console para mais detalhes.");
  }
};

const handleImprimir = () => {
  window.print();
};

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor"]}>
      <DashboardLayout>
        <div id="relatorio-print" className="flex flex-col gap-6">
          <style jsx global>{`
            .print-report {
              display: none;
            }

            @media print {
              @page {
                size: A4;
                margin: 15mm 14mm;
              }

              body {
                background: white !important;
                color: #1f2937 !important;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }

              body * {
                visibility: hidden;
              }

              #relatorio-print .print-report,
              #relatorio-print .print-report * {
                visibility: visible;
              }

              #relatorio-print .screen-report {
                display: none !important;
              }

              #relatorio-print .print-report {
                display: block !important;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                font-family: Arial, Helvetica, sans-serif;
                font-size: 10px;
                color: #1f2937;
              }

              .print-header {
                text-align: center;
                border-bottom: 3px solid #17365d;
                padding-bottom: 14px;
                margin-bottom: 18px;
              }

              .print-header h1 {
                font-size: 17px;
                font-weight: bold;
                color: #17365d;
                letter-spacing: 0.4px;
                margin-bottom: 7px;
              }

              .print-header h2 {
                font-size: 13px;
                font-weight: bold;
                margin-bottom: 5px;
                color: #26364a;
              }

              .print-header p {
                font-size: 9px;
                color: #64748b;
              }

              .print-period {
                background: #eef2f7 !important;
                border-left: 4px solid #17365d;
                padding: 9px 12px;
                margin-bottom: 18px;
              }

              .print-section {
                margin-top: 18px;
                break-inside: auto;
                page-break-inside: auto;
              }

              .print-section h3 {
                color: #17365d;
                font-size: 12px;
                font-weight: bold;
                border-bottom: 1px solid #cbd5e1;
                padding-bottom: 5px;
                margin-bottom: 9px;
                break-after: avoid;
                page-break-after: avoid;
              }

              .print-report table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 12px;
              }

              .print-report thead {
                display: table-header-group;
              }

              .print-report th {
                background: #17365d !important;
                color: white !important;
                font-weight: bold;
                text-align: left;
              }

              .print-report th,
              .print-report td {
                border: 1px solid #cbd5e1;
                padding: 6px 7px;
                vertical-align: top;
              }

              .print-report tbody tr:nth-child(even) {
                background: #f1f5f9 !important;
              }

              .print-report .print-total {
                font-weight: bold;
                color: #17365d;
              }

              .print-footer {
                margin-top: 25px;
                padding-top: 8px;
                border-top: 1px solid #cbd5e1;
                text-align: center;
                font-size: 8px;
                color: #64748b;
              }

              .screen-report {
                display: none !important;
              }

              tr {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
          `}</style>

          {relatorio && (
            <div className="print-report">
              <header className="print-header">
                <h1>LIGA DE BATAGUASSU CONTRA O CÂNCER</h1>
                <h2>RELATÓRIO CONSOLIDADO POR PERÍODO</h2>
                <p>
                  SIG-LBCC — Sistema de Gestão da Liga de Bataguassu Contra o
                  Câncer
                </p>
              </header>

              <div className="print-period">
                <strong>Período analisado: </strong>
                {formatarData(periodoInicio)} até {formatarData(periodoFim)}
                <br />
                <strong>Data de geração: </strong>
                {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
              </div>

              <section className="print-section">
                <h3>1. Indicadores gerais</h3>

                <table>
                  <thead>
                    <tr>
                      <th>Indicador</th>
                      <th>Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Pacientes com atendimentos</td>
                      <td>{resumo?.total_pacientes ?? 0}</td>
                    </tr>
                    <tr>
                      <td>Atendimentos realizados</td>
                      <td>{resumo?.total_atendimentos ?? 0}</td>
                    </tr>
                    <tr>
                      <td>Cotações</td>
                      <td>{resumo?.total_cotacoes ?? 0}</td>
                    </tr>
                    <tr>
                      <td>Cotações ativas</td>
                      <td>{cotacoesAtivas}</td>
                    </tr>
                    <tr>
                      <td>Cotações canceladas</td>
                      <td>{cotacoesCanceladas}</td>
                    </tr>
                    <tr>
                      <td>Cotações vencidas</td>
                      <td>{cotacoesVencidas}</td>
                    </tr>
                    <tr>
                      <td>Ordens de fornecimento</td>
                      <td>{resumo?.total_ordens_fornecimento ?? 0}</td>
                    </tr>
                    <tr>
                      <td>Ordens de transporte</td>
                      <td>{resumo?.total_ordens_transporte ?? 0}</td>
                    </tr>
                    <tr>
                      <td>Divergências identificadas</td>
                      <td>{resumo?.total_divergencias ?? 0}</td>
                    </tr>
                    <tr>
                      <td>Cancelamentos aprovados</td>
                      <td>
                        {resumo?.total_cancelamentos_aprovados ?? 0}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className="print-section">
                <h3>2. Indicadores financeiros</h3>

                <table>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Valor total de fornecimento</td>
                      <td>{formatarMoeda(valorFornecimento)}</td>
                    </tr>
                    <tr>
                      <td>Valor total de transporte</td>
                      <td>{formatarMoeda(valorTransporte)}</td>
                    </tr>
                    <tr className="print-total">
                      <td>Valor geral</td>
                      <td>{formatarMoeda(valorTotal)}</td>
                    </tr>
                  </tbody>
                </table>

                {resumo?.valor_total_geral_parcial && (
                  <p>
                    Observação: o valor geral é parcial, pois existem ordens de
                    transporte sem valor calculado.
                  </p>
                )}

                {resumo?.ordens_transporte_sem_valor_calculado ? (
                  <p>
                    Ordens de transporte sem valor calculado:{" "}
                    {resumo.ordens_transporte_sem_valor_calculado}.
                  </p>
                ) : null}
              </section>

              <section className="print-section">
                <h3>3. Atendimentos por área</h3>

                <table>
                  <thead>
                    <tr>
                      <th>Área</th>
                      <th>Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atendimentosPorArea.length > 0 ? (
                      atendimentosPorArea.map((item) => (
                        <tr key={item.name}>
                          <td>{item.name}</td>
                          <td>{item.value}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2}>Nenhum registro no período.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <section className="print-section">
                <h3>4. Atendimentos por tipo</h3>

                <table>
                  <thead>
                    <tr>
                      <th>Tipo de atendimento</th>
                      <th>Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atendimentosPorTipo.length > 0 ? (
                      atendimentosPorTipo.map((item) => (
                        <tr key={item.name}>
                          <td>{item.name}</td>
                          <td>{item.value}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2}>Nenhum registro no período.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <section className="print-section">
                <h3>5. Cotações por situação</h3>

                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cotacoesPorStatus.length > 0 ? (
                      cotacoesPorStatus.map((item) => (
                        <tr key={item.name}>
                          <td>{item.name}</td>
                          <td>{item.value}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2}>Nenhuma cotação no período.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <section className="print-section">
                <h3>6. Ordens por situação</h3>

                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordensPorStatus.length > 0 ? (
                      ordensPorStatus.map((item) => (
                        <tr key={item.name}>
                          <td>{item.name}</td>
                          <td>{item.value}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2}>Nenhuma ordem no período.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <section className="print-section">
                <h3>7. Divergências registradas</h3>

                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th>Identificada em</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {divergencias.length > 0 ? (
                      divergencias.map((item) => (
                        <tr key={item.id}>
                          <td>{item.tipo || "—"}</td>
                          <td>{item.descricao || "—"}</td>
                          <td>
                            {item.identificado_em
                              ? format(
                                  new Date(item.identificado_em),
                                  "dd/MM/yyyy HH:mm",
                                )
                              : "—"}
                          </td>
                          <td>
                            {STATUS_LABELS[item.status] || item.status || "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>Nenhuma divergência registrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <section className="print-section">
                <h3>8. Solicitações de cancelamento</h3>

                <table>
                  <thead>
                    <tr>
                      <th>Tipo de ordem</th>
                      <th>Motivo</th>
                      <th>Solicitado em</th>
                      <th>Status</th>
                      <th>Necessidade do paciente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cancelamentos.length > 0 ? (
                      cancelamentos.map((item) => (
                        <tr key={item.id}>
                          <td>
                            {item.ordem_fornecimento_id
                              ? "Fornecimento"
                              : item.ordem_transporte_id
                                ? "Transporte"
                                : "—"}
                          </td>
                          <td>{item.motivo || "—"}</td>
                          <td>
                            {item.solicitado_em
                              ? format(
                                  new Date(item.solicitado_em),
                                  "dd/MM/yyyy HH:mm",
                                )
                              : "—"}
                          </td>
                          <td>
                            {STATUS_LABELS[item.status] || item.status || "—"}
                          </td>
                          <td>
                            {item.necessidade_paciente === "continua"
                              ? "Continua"
                              : item.necessidade_paciente === "encerrada"
                                ? "Encerrada"
                                : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5}>Nenhum cancelamento registrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              <footer className="print-footer">
                SIG-LBCC — Sistema de Gestão da Liga de Bataguassu Contra o
                Câncer
                <br />
                Documento gerado eletronicamente para consulta e controle
                interno.
              </footer>
            </div>
          )}

          <div className="screen-report flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Relatórios
                </h1>
                <p className="text-muted-foreground">
                  Relatório consolidado por período
                </p>
              </div>

              {relatorio && (
                <div className="flex flex-wrap gap-2">
                  <Button className="cursor-pointer" variant="outline" onClick={handleImprimir}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                  </Button>

                  <Button className="cursor-pointer"onClick={handleExportarPDF}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
              )}
            </div>

            {/* Filtro de período */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Período de Análise
                </CardTitle>
              </CardHeader>

              <CardContent>
                <FieldGroup className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <Field>
                    <FieldLabel>Data Início</FieldLabel>
                    <Input
                      type="date"
                      value={periodoInicio}
                      max={periodoFim}
                      onChange={(e) => setPeriodoInicio(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Data Fim</FieldLabel>
                    <Input
                      type="date"
                      value={periodoFim}
                      min={periodoInicio}
                      onChange={(e) => setPeriodoFim(e.target.value)}
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            {isLoading && (
              <p className="text-sm text-muted-foreground">
                Carregando relatório...
              </p>
            )}

            {isError && (
              <Card>
                <CardContent className="py-6">
                  <p className="text-sm text-destructive">
                    Não foi possível carregar o relatório:{" "}
                    {error instanceof Error
                      ? error.message
                      : "Erro desconhecido."}
                  </p>
                </CardContent>
              </Card>
            )}

            {relatorio && (
              <>
                {/* Indicadores gerais */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Pacientes
                      </CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {resumo?.total_pacientes ?? 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Com atendimentos no período
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Atendimentos
                      </CardTitle>
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {resumo?.total_atendimentos ?? 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        No período selecionado
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Cotações
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {resumo?.total_cotacoes ?? 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cotacoesAtivas} ativas, {cotacoesCanceladas} canceladas
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Cotações Vencidas
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {cotacoesVencidas}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Não canceladas com validade expirada
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Ordens de Fornecimento
                      </CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {resumo?.total_ordens_fornecimento ?? 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Emitidas no período
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Ordens de Transporte
                      </CardTitle>
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {resumo?.total_ordens_transporte ?? 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Emitidas no período
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Divergências
                      </CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {resumo?.total_divergencias ?? 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Identificadas no período
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">
                        Cancelamentos Aprovados
                      </CardTitle>
                      <Ban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {resumo?.total_cancelamentos_aprovados ?? 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        No período selecionado
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Indicadores financeiros */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Valor de Fornecimento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatarMoeda(valorFornecimento)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Valor de Transporte
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatarMoeda(valorTransporte)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Valor Geral Parcial
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatarMoeda(valorTotal)}
                      </div>
                      {resumo?.valor_total_geral_parcial && (
                        <p className="text-xs text-muted-foreground">
                          Total parcial: existem OTs sem valor calculado.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {resumo?.ordens_transporte_sem_valor_calculado ? (
                  <p className="text-sm text-muted-foreground">
                    {resumo.ordens_transporte_sem_valor_calculado} ordem(ns) de
                    transporte sem valor calculado.
                  </p>
                ) : null}

                {/* Gráficos */}
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
                      {atendimentosPorArea.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={atendimentosPorArea}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-muted"
                            />
                            <XAxis dataKey="name" className="text-xs" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar
                              dataKey="value"
                              fill="#2563eb"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-75 items-center justify-center text-muted-foreground">
                          Nenhum atendimento por área no período.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Atendimentos por Tipo</CardTitle>
                      <CardDescription>
                        Tipos de atendimentos no período
                      </CardDescription>
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
                              dataKey="value"
                            >
                              {atendimentosPorTipo.map((entry, index) => (
                                <Cell
                                  key={`cell-${entry.name}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-75 items-center justify-center text-muted-foreground">
                          Nenhum atendimento no período.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cotações por Status</CardTitle>
                      <CardDescription>
                        Situação das cotações no período
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {cotacoesPorStatus.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={cotacoesPorStatus} layout="vertical">
                            <CartesianGrid
                              strokeDasharray="3 3"
                              className="stroke-muted"
                            />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={130}
                              className="text-xs"
                            />
                            <Tooltip />
                            <Bar
                              dataKey="value"
                              fill="#16a34a"
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-75 items-center justify-center text-muted-foreground">
                          Nenhuma cotação no período.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Ordens por Status</CardTitle>
                      <CardDescription>
                        Situação das ordens de fornecimento e transporte
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ordensPorStatus.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={ordensPorStatus}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) =>
                                `${name} (${(percent * 100).toFixed(0)}%)`
                              }
                              outerRadius={100}
                              dataKey="value"
                            >
                              {ordensPorStatus.map((entry, index) => (
                                <Cell
                                  key={`ordem-${entry.name}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-75 items-center justify-center text-muted-foreground">
                          Nenhuma ordem no período.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Tabela de divergências */}
                <Card>
                  <CardHeader>
                    <CardTitle>Divergências do Período</CardTitle>
                    <CardDescription>
                      Registro das divergências identificadas nas ordens
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {divergencias.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Identificada em</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {divergencias.map((divergencia) => (
                              <TableRow key={divergencia.id}>
                                <TableCell className="font-medium">
                                  {divergencia.tipo}
                                </TableCell>
                                <TableCell>
                                  {divergencia.descricao || "—"}
                                </TableCell>
                                <TableCell>
                                  {divergencia.identificado_em
                                    ? format(
                                        new Date(divergencia.identificado_em),
                                        "dd/MM/yyyy HH:mm",
                                      )
                                    : "—"}
                                </TableCell>
                                <TableCell>
                                  {STATUS_LABELS[divergencia.status] ||
                                    divergencia.status ||
                                    "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma divergência identificada no período.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Tabela de cancelamentos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cancelamentos</CardTitle>
                    <CardDescription>
                      Solicitações de cancelamento registradas no período
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {cancelamentos.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ordem</TableHead>
                              <TableHead>Motivo</TableHead>
                              <TableHead>Solicitado em</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Necessidade do paciente</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cancelamentos.map((cancelamento) => (
                              <TableRow key={cancelamento.id}>
                                <TableCell className="font-medium">
                                  {cancelamento.ordem_fornecimento_id
                                    ? "Fornecimento"
                                    : cancelamento.ordem_transporte_id
                                      ? "Transporte"
                                      : "—"}
                                </TableCell>
                                <TableCell>
                                  {cancelamento.motivo || "—"}
                                </TableCell>
                                <TableCell>
                                  {cancelamento.solicitado_em
                                    ? format(
                                        new Date(cancelamento.solicitado_em),
                                        "dd/MM/yyyy HH:mm",
                                      )
                                    : "—"}
                                </TableCell>
                                <TableCell>
                                  {STATUS_LABELS[cancelamento.status] ||
                                    cancelamento.status ||
                                    "—"}
                                </TableCell>
                                <TableCell>
                                  {cancelamento.necessidade_paciente ===
                                  "continua"
                                    ? "Continua"
                                    : cancelamento.necessidade_paciente ===
                                        "encerrada"
                                      ? "Encerrada"
                                      : "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum cancelamento registrado no período.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
