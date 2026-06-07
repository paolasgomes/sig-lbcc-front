import {
  ClipboardList,
  Activity,
  FileText,
  File,
  CircleDot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type HistoricoCategoria =
  | "atendimento"
  | "status"
  | "cotacao"
  | "documento"
  | "outro";

const ATENDIMENTO_EVENTS = new Set([
  "ATENDIMENTO",
  "ATENDIMENTO_REGISTRADO",
  "ATENDIMENTO_REMOVIDO",
]);

const COTACAO_EVENTS = new Set(["COTACAO_CRIADA", "COTACAO_EDITADA"]);

const DOCUMENTO_EVENTS = new Set(["DOCUMENTO_ANEXADO", "DOCUMENTO_REMOVIDO"]);

const EVENTOS_SEM_LINK = new Set(["ATENDIMENTO_REMOVIDO", "DOCUMENTO_REMOVIDO"]);

export function getHistoricoCategoria(tipoEvento: string): HistoricoCategoria {
  const normalized = tipoEvento.toUpperCase();

  if (ATENDIMENTO_EVENTS.has(normalized)) return "atendimento";
  if (normalized === "ALTERACAO_STATUS") return "status";
  if (COTACAO_EVENTS.has(normalized)) return "cotacao";
  if (DOCUMENTO_EVENTS.has(normalized)) return "documento";

  return "outro";
}

export function getHistoricoLink(
  referenciaId: string | null | undefined,
  tipoEvento: string,
): string | null {
  if (!referenciaId) return null;

  if (EVENTOS_SEM_LINK.has(tipoEvento.toUpperCase())) return null;

  const categoria = getHistoricoCategoria(tipoEvento);

  if (categoria === "atendimento") return `/atendimentos/${referenciaId}`;
  if (categoria === "cotacao") return `/cotacoes/${referenciaId}`;

  return null;
}

const CATEGORIA_CONFIG: Record<
  HistoricoCategoria,
  { icon: LucideIcon; colorClass: string; label: string }
> = {
  atendimento: {
    icon: ClipboardList,
    colorClass: "bg-success/15 text-success",
    label: "Atendimento",
  },
  status: {
    icon: Activity,
    colorClass: "bg-warning/15 text-warning",
    label: "Alteração de status",
  },
  cotacao: {
    icon: FileText,
    colorClass: "bg-chart-1/15 text-chart-1",
    label: "Cotação",
  },
  documento: {
    icon: File,
    colorClass: "bg-secondary text-secondary-foreground",
    label: "Documento",
  },
  outro: {
    icon: CircleDot,
    colorClass: "bg-muted text-muted-foreground",
    label: "Evento",
  },
};

export function getHistoricoCategoriaConfig(categoria: HistoricoCategoria) {
  return CATEGORIA_CONFIG[categoria];
}
