"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { Paciente, StatusPaciente, Sexo, EstadoCivil, TipoEvento } from "@/types";

interface PacienteFormProps {
  paciente?: Paciente;
  modo: "criar" | "editar";
}

const sexoOptions = [
  { value: Sexo.MASCULINO, label: "Masculino" },
  { value: Sexo.FEMININO, label: "Feminino" },
  { value: Sexo.OUTRO, label: "Outro" },
];

const estadoCivilOptions = [
  { value: EstadoCivil.SOLTEIRO, label: "Solteiro(a)" },
  { value: EstadoCivil.CASADO, label: "Casado(a)" },
  { value: EstadoCivil.DIVORCIADO, label: "Divorciado(a)" },
  { value: EstadoCivil.VIUVO, label: "Viúvo(a)" },
  { value: EstadoCivil.UNIAO_ESTAVEL, label: "União Estável" },
];

export function PacienteForm({ paciente, modo }: PacienteFormProps) {
  const router = useRouter();
  const { addPaciente, updatePaciente, addHistorico } = useData();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nomeCompleto: paciente?.nomeCompleto || "",
    cpf: paciente?.cpf || "",
    rg: paciente?.rg || "",
    dataNascimento: paciente?.dataNascimento || "",
    sexo: paciente?.sexo || Sexo.MASCULINO,
    estadoCivil: paciente?.estadoCivil || EstadoCivil.SOLTEIRO,
    profissao: paciente?.profissao || "",
    telefone: paciente?.telefone || "",
    numeroSUS: paciente?.numeroSUS || "",
    diagnosticoOncologico: paciente?.diagnosticoOncologico || "",
    setor: paciente?.setor || "",
    areaTratamento: paciente?.areaTratamento || "",
    dataInicioTratamento: paciente?.dataInicioTratamento || "",
    medicoResponsavel: paciente?.medicoResponsavel || "",
    endereco: {
      logradouro: paciente?.endereco.logradouro || "",
      numero: paciente?.endereco.numero || "",
      complemento: paciente?.endereco.complemento || "",
      bairro: paciente?.endereco.bairro || "",
      cidade: paciente?.endereco.cidade || "Bataguassu",
      estado: paciente?.endereco.estado || "MS",
      cep: paciente?.endereco.cep || "",
    },
  });

  const handleChange = (field: string, value: string) => {
    if (field.startsWith("endereco.")) {
      const enderecoField = field.replace("endereco.", "");
      setFormData((prev) => ({
        ...prev,
        endereco: { ...prev.endereco, [enderecoField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      const agora = new Date().toISOString();

      if (modo === "criar") {
        const novoPaciente = await addPaciente({
          ...formData,
          status: StatusPaciente.ATIVO,
        });

        addHistorico({
          id: `hist-${Date.now()}`,
          pacienteId: novoPaciente.id,
          dataHora: agora,
          tipoEvento: TipoEvento.CADASTRO,
          descricao: "Paciente cadastrado no sistema",
          usuarioResponsavel: usuario?.nome || "Sistema",
        });

        router.push(`/pacientes/${novoPaciente.id}`);
      } else if (paciente) {
        await updatePaciente(paciente.id, formData);

        addHistorico({
          id: `hist-${Date.now()}`,
          pacienteId: paciente.id,
          dataHora: agora,
          tipoEvento: TipoEvento.ATUALIZACAO,
          descricao: "Dados do paciente atualizados",
          usuarioResponsavel: usuario?.nome || "Sistema",
        });

        router.push(`/pacientes/${paciente.id}`);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Erro ao salvar paciente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="nomeCompleto">Nome Completo *</FieldLabel>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={(e) => handleChange("nomeCompleto", e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="cpf">CPF *</FieldLabel>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleChange("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="rg">RG</FieldLabel>
                <Input
                  id="rg"
                  value={formData.rg}
                  onChange={(e) => handleChange("rg", e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="dataNascimento">Data de Nascimento *</FieldLabel>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => handleChange("dataNascimento", e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="sexo">Sexo *</FieldLabel>
                <Select
                  value={formData.sexo}
                  onValueChange={(v) => handleChange("sexo", v)}
                >
                  <SelectTrigger id="sexo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sexoOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="estadoCivil">Estado Civil</FieldLabel>
                <Select
                  value={formData.estadoCivil}
                  onValueChange={(v) => handleChange("estadoCivil", v)}
                >
                  <SelectTrigger id="estadoCivil">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {estadoCivilOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="profissao">Profissão</FieldLabel>
                <Input
                  id="profissao"
                  value={formData.profissao}
                  onChange={(e) => handleChange("profissao", e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="telefone">Telefone *</FieldLabel>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="numeroSUS">Número do SUS *</FieldLabel>
                <Input
                  id="numeroSUS"
                  value={formData.numeroSUS}
                  onChange={(e) => handleChange("numeroSUS", e.target.value)}
                  required
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="logradouro">Logradouro</FieldLabel>
                <Input
                  id="logradouro"
                  value={formData.endereco.logradouro}
                  onChange={(e) => handleChange("endereco.logradouro", e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="numero">Número</FieldLabel>
                <Input
                  id="numero"
                  value={formData.endereco.numero}
                  onChange={(e) => handleChange("endereco.numero", e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="complemento">Complemento</FieldLabel>
                <Input
                  id="complemento"
                  value={formData.endereco.complemento}
                  onChange={(e) => handleChange("endereco.complemento", e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="bairro">Bairro</FieldLabel>
                <Input
                  id="bairro"
                  value={formData.endereco.bairro}
                  onChange={(e) => handleChange("endereco.bairro", e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="cidade">Cidade</FieldLabel>
                <Input
                  id="cidade"
                  value={formData.endereco.cidade}
                  onChange={(e) => handleChange("endereco.cidade", e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="estado">Estado</FieldLabel>
                <Input
                  id="estado"
                  value={formData.endereco.estado}
                  onChange={(e) => handleChange("endereco.estado", e.target.value)}
                  maxLength={2}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="cep">CEP</FieldLabel>
                <Input
                  id="cep"
                  value={formData.endereco.cep}
                  onChange={(e) => handleChange("endereco.cep", e.target.value)}
                  placeholder="00000-000"
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Dados Clínicos */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Clínicos</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="diagnosticoOncologico">
                  Diagnóstico Oncológico *
                </FieldLabel>
                <Textarea
                  id="diagnosticoOncologico"
                  value={formData.diagnosticoOncologico}
                  onChange={(e) => handleChange("diagnosticoOncologico", e.target.value)}
                  placeholder="Ex: Câncer de mama - CID C50"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="setor">Setor</FieldLabel>
                <Input
                  id="setor"
                  value={formData.setor}
                  onChange={(e) => handleChange("setor", e.target.value)}
                  placeholder="Ex: Oncologia"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="areaTratamento">Área de Tratamento</FieldLabel>
                <Input
                  id="areaTratamento"
                  value={formData.areaTratamento}
                  onChange={(e) => handleChange("areaTratamento", e.target.value)}
                  placeholder="Ex: Quimioterapia"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="dataInicioTratamento">
                  Data de Início do Tratamento
                </FieldLabel>
                <Input
                  id="dataInicioTratamento"
                  type="date"
                  value={formData.dataInicioTratamento}
                  onChange={(e) => handleChange("dataInicioTratamento", e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="medicoResponsavel">Médico Responsável</FieldLabel>
                <Input
                  id="medicoResponsavel"
                  value={formData.medicoResponsavel}
                  onChange={(e) => handleChange("medicoResponsavel", e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {submitError && (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível salvar o paciente</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Ações */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Salvando..."
            : modo === "criar"
              ? "Cadastrar Paciente"
              : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}
