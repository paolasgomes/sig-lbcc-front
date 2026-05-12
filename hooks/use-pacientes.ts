"use client";

import { useQuery } from "@tanstack/react-query";
import { listarPacientes, ApiPacienteDTO } from "@/services/pacientes-service";
import { Paciente, Sexo, EstadoCivil, StatusPaciente } from "@/types";
import { formatCep, formatCpf, formatPhone, toDateInputValue } from "@/lib/formatters";

function formatApiDate(date?: string | null) {
  return toDateInputValue(date);
}

function mapApiSexoToSexo(sexo?: string | null): Sexo {
  if (!sexo) return Sexo.OUTRO;
  const normalized = sexo.trim().toUpperCase();
  if (normalized === "M" || normalized === "MASCULINO") return Sexo.MASCULINO;
  if (normalized === "F" || normalized === "FEMININO") return Sexo.FEMININO;
  return Sexo.OUTRO;
}

function mapApiEstadoCivilToEstadoCivil(estadoCivil?: string | null): EstadoCivil {
  if (!estadoCivil) return EstadoCivil.SOLTEIRO;
  const normalized = estadoCivil.trim().toLowerCase();
  if (normalized.includes("casad")) return EstadoCivil.CASADO;
  if (normalized.includes("divorc")) return EstadoCivil.DIVORCIADO;
  if (normalized.includes("viuv")) return EstadoCivil.VIUVO;
  if (normalized.includes("uniao") || normalized.includes("união"))
    return EstadoCivil.UNIAO_ESTAVEL;
  return EstadoCivil.SOLTEIRO;
}

function mapApiStatusToStatusPaciente(status?: string | null): StatusPaciente {
  if (!status) return StatusPaciente.ATIVO;
  const normalized = status.trim().toLowerCase();
  if (normalized === "suspenso") return StatusPaciente.SUSPENSO;
  if (normalized === "encerrado" || normalized === "inativo")
    return StatusPaciente.ENCERRADO;
  return StatusPaciente.ATIVO;
}

function mapApiPacienteToPaciente(apiPaciente: ApiPacienteDTO): Paciente {
  return {
    id: apiPaciente.id ?? apiPaciente.id_origem ?? "",
    nome: apiPaciente.nome ?? "",
    nomeCompleto: apiPaciente.nome ?? "",
    cpf: formatCpf(apiPaciente.cpf),
    rg: apiPaciente.rg ?? "",
    dataNascimento: formatApiDate(apiPaciente.data_nascimento),
    sexo: mapApiSexoToSexo(apiPaciente.sexo),
    estadoCivil: mapApiEstadoCivilToEstadoCivil(apiPaciente.estado_civil),
    naturalidade: "",
    escolaridade: "",
    profissao: apiPaciente.profissao ?? "",
    endereco: {
      logradouro: apiPaciente.endereco ?? "",
      numero: apiPaciente.numero ?? "",
      complemento: apiPaciente.complemento ?? "",
      bairro: apiPaciente.bairro ?? "",
      cidade: apiPaciente.cidade ?? "",
      estado: apiPaciente.estado ?? "",
      cep: formatCep(apiPaciente.cep ?? ""),
    },
    telefone: formatPhone(apiPaciente.celular ?? apiPaciente.telefone ?? ""),
    nomePai: "",
    nomeMae: "",
    numeroSUS: apiPaciente.id_origem ?? "",
    diagnosticoOncologico: apiPaciente.diagnostico ?? "",
    diagnostico: apiPaciente.diagnostico ?? "",
    setor: apiPaciente.hospital_tratamento ?? "",
    areaTratamento: apiPaciente.origem ?? "",
    dataInicioTratamento: formatApiDate(apiPaciente.data_inicio_tratamento),
    medicoResponsavel: apiPaciente.medico_responsavel ?? "",
    status: mapApiStatusToStatusPaciente(apiPaciente.status),
    criadoEm: apiPaciente.created_at,
    atualizadoEm: apiPaciente.updated_at,
  };
}

export function usePacientes() {
  const query = useQuery({
    queryKey: ["pacientes"],
    queryFn: async () => {
      const dados = await listarPacientes();
      return dados.map(mapApiPacienteToPaciente);
    },
  });

  return {
    pacientes: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    query,
  };
}
