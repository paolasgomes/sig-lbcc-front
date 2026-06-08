import { describe, it, expect } from "vitest";
import {
  mapApiStatusToStatusPaciente,
  computePacienteStats,
} from "./pacientes-utils";
import { StatusPaciente } from "@/types";
import type { Paciente } from "@/types";

describe("mapApiStatusToStatusPaciente", () => {
  it("maps suspenso and inativo to SUSPENSO", () => {
    expect(mapApiStatusToStatusPaciente("suspenso")).toBe(StatusPaciente.SUSPENSO);
    expect(mapApiStatusToStatusPaciente("inativo")).toBe(StatusPaciente.SUSPENSO);
    expect(mapApiStatusToStatusPaciente("SUSPENSO")).toBe(StatusPaciente.SUSPENSO);
  });

  it("maps encerrado, alta and obito to ENCERRADO", () => {
    expect(mapApiStatusToStatusPaciente("encerrado")).toBe(StatusPaciente.ENCERRADO);
    expect(mapApiStatusToStatusPaciente("alta")).toBe(StatusPaciente.ENCERRADO);
    expect(mapApiStatusToStatusPaciente("obito")).toBe(StatusPaciente.ENCERRADO);
  });

  it("defaults to ATIVO for ativo and unknown values", () => {
    expect(mapApiStatusToStatusPaciente("ativo")).toBe(StatusPaciente.ATIVO);
    expect(mapApiStatusToStatusPaciente(null)).toBe(StatusPaciente.ATIVO);
    expect(mapApiStatusToStatusPaciente(undefined)).toBe(StatusPaciente.ATIVO);
    expect(mapApiStatusToStatusPaciente("")).toBe(StatusPaciente.ATIVO);
  });
});

describe("computePacienteStats", () => {
  const makePaciente = (status: StatusPaciente): Paciente =>
    ({
      id: "1",
      nome: "Test",
      nomeCompleto: "Test",
      cpf: "000.000.000-00",
      status,
    }) as Paciente;

  it("counts patients by status", () => {
    const pacientes = [
      makePaciente(StatusPaciente.ATIVO),
      makePaciente(StatusPaciente.ATIVO),
      makePaciente(StatusPaciente.SUSPENSO),
      makePaciente(StatusPaciente.ENCERRADO),
    ];

    expect(computePacienteStats(pacientes)).toEqual({
      totalPacientes: 4,
      pacientesAtivos: 2,
      pacientesSuspensos: 1,
      pacientesEncerrados: 1,
    });
  });

  it("returns zeros for empty list", () => {
    expect(computePacienteStats([])).toEqual({
      totalPacientes: 0,
      pacientesAtivos: 0,
      pacientesSuspensos: 0,
      pacientesEncerrados: 0,
    });
  });
});
