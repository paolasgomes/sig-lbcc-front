import type { ApiPacienteDTO } from "@/services/pacientes-service";
import {
  formatCep,
  formatCpf,
  formatPhone,
  toDateInputValue,
} from "@/lib/formatters";
import { Paciente, Sexo, EstadoCivil, StatusPaciente } from "@/types";

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

export function mapApiStatusToStatusPaciente(
  status?: string | null,
): StatusPaciente {
  if (!status) return StatusPaciente.ATIVO;
  const normalized = status.trim().toLowerCase();
  if (normalized === "suspenso" || normalized === "inativo")
    return StatusPaciente.SUSPENSO;
  if (
    normalized === "encerrado" ||
    normalized === "alta" ||
    normalized === "obito"
  )
    return StatusPaciente.ENCERRADO;
  return StatusPaciente.ATIVO;
}

export function mapApiPacienteToPaciente(apiPaciente: ApiPacienteDTO): Paciente {
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

export function computePacienteStats(pacientes: Paciente[]) {
  return {
    totalPacientes: pacientes.length,
    pacientesAtivos: pacientes.filter((p) => p.status === StatusPaciente.ATIVO)
      .length,
    pacientesSuspensos: pacientes.filter(
      (p) => p.status === StatusPaciente.SUSPENSO,
    ).length,
    pacientesEncerrados: pacientes.filter(
      (p) => p.status === StatusPaciente.ENCERRADO,
    ).length,
  };
}
