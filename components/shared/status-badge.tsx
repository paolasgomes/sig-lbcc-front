import { StatusPaciente, StatusCotacao } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status?: StatusPaciente | StatusCotacao | string;
  type?: string;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  // =========================
  // STATUS DE PACIENTE
  // =========================

  [StatusPaciente.ATIVO]: {
    label: "Ativo",
    className:
      "bg-success/15 text-success border-success/30",
  },

  [StatusPaciente.SUSPENSO]: {
    label: "Suspenso",
    className:
      "bg-warning/15 text-warning border-warning/30",
  },

  [StatusPaciente.ENCERRADO]: {
    label: "Encerrado",
    className:
      "bg-muted text-muted-foreground border-border",
  },

  // =========================
  // STATUS DE COTAÇÃO
  // =========================

  [StatusCotacao.ABERTA]: {
    label: "Aberta",
    className:
      "bg-info/15 text-info border-info/30",
  },

  [StatusCotacao.EM_ANDAMENTO]: {
    label: "Em andamento",
    className:
      "bg-warning/15 text-warning border-warning/30",
  },

  [StatusCotacao.PRONTA_PARA_ANALISE]: {
    label: "Pronta para análise",
    className:
      "bg-purple-500/15 text-purple-600 border-purple-500/30",
  },

  [StatusCotacao.FINALIZADA]: {
    label: "Finalizada",
    className:
      "bg-success/15 text-success border-success/30",
  },

  [StatusCotacao.CANCELADA]: {
    label: "Cancelada",
    className:
      "bg-destructive/15 text-destructive border-destructive/30",
  },

  // =========================
  // OUTROS STATUS
  // =========================

  agendado: {
    label: "Agendado",
    className:
      "bg-info/15 text-info border-info/30",
  },

  concluido: {
    label: "Concluído",
    className:
      "bg-success/15 text-success border-success/30",
  },
};

export function StatusBadge({
  status,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status ?? ""] ?? {
    label: String(status ?? "-"),
    className:
      "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}