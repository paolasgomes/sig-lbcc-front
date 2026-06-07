import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

function todayDateOnly(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function isCotacaoVencida(dataValidade: string): boolean {
  return toDateOnly(dataValidade) < todayDateOnly();
}

export function formatDateOnly(value: string): string {
  const parsed = parse(toDateOnly(value), "yyyy-MM-dd", new Date());

  if (!isValid(parsed)) {
    return value;
  }

  return format(parsed, "dd/MM/yyyy", { locale: ptBR });
}

export function formatCotacaoNumero(cotacao: { numero?: string | null; id: string }): string {
  if (cotacao.numero) {
    return cotacao.numero;
  }

  return cotacao.id.slice(0, 8).toUpperCase();
}
