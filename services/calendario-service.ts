import { api } from "@/services/api";

export interface Feriado {
  id: string;
  data: string;
  nome: string;
  ativo: boolean;
  criado_por: string | null;
  atualizado_por: string | null;
  created_at: string;
  updated_at: string;
}

export async function listarFeriados() {
  const response = await api.get<Feriado[]>("/calendario/feriados");
  return response.data;
}

export async function criarFeriado(dados: { data: string; nome: string }) {
  const response = await api.post<Feriado>("/calendario/feriados", dados);
  return response.data;
}

export async function atualizarFeriado(
  id: string,
  dados: Partial<Pick<Feriado, "data" | "nome">>,
) {
  const response = await api.put<Feriado>(`/calendario/feriados/${id}`, dados);
  return response.data;
}

export async function alternarStatusFeriado(id: string, ativo: boolean) {
  const response = await api.patch<Feriado>(
    `/calendario/feriados/${id}/status`,
    { ativo },
  );
  return response.data;
}
