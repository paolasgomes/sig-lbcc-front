import axios from "axios";
import { api } from "./api";

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export interface ApiPacienteDTO {
  id: string;
  nome: string;
  cpf: string;
  rg?: string | null;
  data_nascimento: string;
  sexo: string;
  estado_civil?: string | null;
  profissao?: string | null;
  telefone?: string | null;
  celular?: string | null;
  email?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  diagnostico?: string | null;
  cid?: string | null;
  hospital_tratamento?: string | null;
  medico_responsavel?: string | null;
  data_inicio_tratamento?: string | null;
  status?: string | null;
  observacoes?: string | null;
  origem?: string | null;
  id_origem?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PacienteCreateInput {
  nome: string;
  cpf: string;
  data_nascimento: string;
  sexo: string;
  telefone?: string;
  celular?: string;
  cidade?: string;
  rg?: string;
  estado_civil?: string;
  profissao?: string;
  email?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  estado?: string;
  cep?: string;
  diagnostico?: string;
  cid?: string;
  hospital_tratamento?: string;
  medico_responsavel?: string;
  data_inicio_tratamento?: string;
  status?: string;
  observacoes?: string;
  origem?: string;
  id_origem?: string;
}

export type PacienteUpdateInput = Partial<PacienteCreateInput>;

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error || error.response?.data?.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function listarPacientes() {
  try {
    const response = await api.get<ApiPacienteDTO[]>("/pacientes");

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar pacientes."));
  }
}

export async function obterPaciente(id: string) {
  try {
    const response = await api.get<ApiPacienteDTO>(`/pacientes/${id}`);

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar paciente."));
  }
}

export async function criarPaciente(dados: PacienteCreateInput) {
  try {
    const response = await api.post<ApiPacienteDTO>("/pacientes", dados);

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao criar paciente."));
  }
}

export async function atualizarPaciente(id: string, dados: PacienteUpdateInput) {
  try {
    const response = await api.put<ApiPacienteDTO>(`/pacientes/${id}`, dados);

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao atualizar paciente."));
  }
}

export async function inativarPaciente(id: string) {
  try {
    await api.delete(`/pacientes/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao inativar paciente."));
  }
}
