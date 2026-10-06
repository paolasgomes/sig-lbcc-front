import type { StatusPrazo } from "@/services/fornecimento-service";

export function formatDateOnly(value: string | null | undefined) {
  if (!value) return "-";

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;

  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function getStatusPrazoLabel(status: StatusPrazo | string | null | undefined) {
  const labels: Record<string, string> = {
    normal: "Normal",
    proxima_expiracao: "Próxima à expiração",
    atrasada: "Atrasada",
  };

  return labels[status ?? ""] ?? status ?? "-";
}

export function getStatusPrazoClassName(status: StatusPrazo | string | null | undefined) {
  if (status === "atrasada") return "bg-destructive/15 text-destructive border-destructive/30";
  if (status === "proxima_expiracao") return "bg-warning/15 text-warning border-warning/30";
  return "bg-success/15 text-success border-success/30";
}
