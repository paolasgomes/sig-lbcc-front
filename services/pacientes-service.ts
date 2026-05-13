import { api } from "./api";
import type { Documento } from "@/types";
import { getFriendlyApiError } from "@/lib/api-errors";

interface ApiDocumentoDTO {
  id: string;
  paciente_id?: string;
  pacienteId?: string;
  nome?: string;
  nome_arquivo?: string;
  tipo?: string;
  url?: string | null;
  tamanho?: string | number | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
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
  return getFriendlyApiError(error, fallback);
}

function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(0)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mapApiDocumentoToDocumento(
  documento: ApiDocumentoDTO,
  fallbackFile?: File,
): Documento {
  return {
    id: documento.id,
    pacienteId: documento.paciente_id || documento.pacienteId || "",
    nomeArquivo:
      documento.nome || documento.nome_arquivo || fallbackFile?.name || "Documento",
    tipo: documento.tipo || "",
    dataUpload: documento.created_at || new Date().toISOString(),
    tamanho:
      typeof documento.tamanho === "number"
        ? formatFileSize(documento.tamanho)
        : documento.tamanho || (fallbackFile ? formatFileSize(fallbackFile.size) : ""),
    url: documento.url || "",
  };
}

function normalizeDocumentosResponse(data: unknown): ApiDocumentoDTO[] {
  if (Array.isArray(data)) {
    return data as ApiDocumentoDTO[];
  }

  if (data && typeof data === "object") {
    const possiveisListas = [
      (data as { data?: unknown }).data,
      (data as { documentos?: unknown }).documentos,
      (data as { items?: unknown }).items,
    ];

    for (const lista of possiveisListas) {
      if (Array.isArray(lista)) {
        return lista as ApiDocumentoDTO[];
      }
    }
  }

  return [];
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

    // Normaliza resposta possivelmente embrulhada em { data: {...} }
    const data = (response.data as any)?.data ?? response.data;

    return data as ApiPacienteDTO;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar paciente."));
  }
}

export async function criarPaciente(dados: PacienteCreateInput) {
  try {
    const response = await api.post<ApiPacienteDTO>("/pacientes", dados);

    const data = (response.data as any)?.data ?? response.data;

    return data as ApiPacienteDTO;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao criar paciente."));
  }
}

export async function atualizarPaciente(id: string, dados: PacienteUpdateInput) {
  try {
    const response = await api.put<ApiPacienteDTO>(`/pacientes/${id}`, dados);

    const data = (response.data as any)?.data ?? response.data;

    return data as ApiPacienteDTO;
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

export async function uploadDocumento({
  pacienteId,
  file,
  tipo,
}: {
  pacienteId: string;
  file: File;
  tipo: string;
}) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tipo", tipo);

    const response = await api.post(`/pacientes/${pacienteId}/documentos`, formData);

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao enviar documento."));
  }
}

export async function listarDocumentosPaciente(pacienteId: string) {
  try {
    const response = await api.get(`/pacientes/${pacienteId}/documentos`);
    const documentosApi = normalizeDocumentosResponse(response.data);

    return documentosApi.map((documento) => mapApiDocumentoToDocumento(documento));
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar documentos do paciente."));
  }
}
