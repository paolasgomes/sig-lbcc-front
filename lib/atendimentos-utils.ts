import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TipoAtendimento } from "@/types";

const TIPO_LABELS: Record<TipoAtendimento, string> = {
  consulta: "Consulta",
  exame: "Exame",
  procedimento: "Procedimento",
  internacao: "Internação",
  quimioterapia: "Quimioterapia",
  radioterapia: "Radioterapia",
  outro: "Outro",
};

export function getTipoAtendimentoLabel(tipo: string): string {
  return TIPO_LABELS[tipo as TipoAtendimento] ?? tipo;
}

export function formatDataAtendimento(dataAtendimento: string): string {
  const dateOnly = dataAtendimento.slice(0, 10);
  const parsed = parse(dateOnly, "yyyy-MM-dd", new Date());

  if (!isValid(parsed)) {
    return dataAtendimento;
  }

  return format(parsed, "dd/MM/yyyy", { locale: ptBR });
}

export function todayDateOnly(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
