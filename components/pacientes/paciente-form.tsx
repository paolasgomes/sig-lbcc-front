"use client";

import { useState, useEffect } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import {
  formatCep,
  formatCpf,
  formatPhone,
  toDateInputValue,
  onlyDigits,
} from "@/lib/formatters";
import { fetchCepData } from "@/services/cep-service";
import { Paciente, StatusPaciente, Sexo, EstadoCivil, TipoEvento } from "@/types";
import { Check, ChevronsUpDown } from "lucide-react";

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
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const [estadoOptions, setEstadoOptions] = useState<
    Array<{ id: number; value: string; label: string }>
  >([]);
  const [estadosLoading, setEstadosLoading] = useState(false);
  const [estadoQuery, setEstadoQuery] = useState("");
  const [estadoOpen, setEstadoOpen] = useState(false);

  const [cidadeOptionsMap, setCidadeOptionsMap] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});
  const [cidadesLoading, setCidadesLoading] = useState(false);
  const [cidadeQuery, setCidadeQuery] = useState("");
  const [cidadeOpen, setCidadeOpen] = useState(false);

  const [formData, setFormData] = useState({
    nomeCompleto: paciente?.nomeCompleto || "",
    cpf: paciente?.cpf ? formatCpf(paciente.cpf) : "",
    rg: paciente?.rg || "",
    dataNascimento: toDateInputValue(paciente?.dataNascimento),
    sexo: paciente?.sexo || Sexo.MASCULINO,
    estadoCivil: paciente?.estadoCivil || EstadoCivil.SOLTEIRO,
    profissao: paciente?.profissao || "",
    telefone: paciente?.telefone ? formatPhone(paciente.telefone) : "",
    numeroSUS: paciente?.numeroSUS || "",
    diagnosticoOncologico: paciente?.diagnosticoOncologico || "",
    setor: paciente?.setor || "",
    areaTratamento: paciente?.areaTratamento || "",
    dataInicioTratamento: toDateInputValue(paciente?.dataInicioTratamento),
    medicoResponsavel: paciente?.medicoResponsavel || "",
    endereco: {
      logradouro: paciente?.endereco.logradouro || "",
      numero: paciente?.endereco.numero || "",
      complemento: paciente?.endereco.complemento || "",
      bairro: paciente?.endereco.bairro || "",
      cidade: paciente?.endereco.cidade || "Bataguassu",
      estado: paciente?.endereco.estado || "MS",
      cep: paciente?.endereco.cep ? formatCep(paciente.endereco.cep) : "",
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

  const lookupCep = async (rawCep: string) => {
    setCepError(null);
    setCepLoading(true);

    try {
      const clean = rawCep.replace(/\D/g, "");

      // Only trigger when 8 digits
      if (clean.length !== 8) {
        setCepLoading(false);
        return;
      }

      const data = await fetchCepData(clean);

      if (!data) {
        setCepError("CEP não encontrado.");
        setCepLoading(false);
        return;
      }

      // Preenche os campos de endereço retornados
      setFormData((prev) => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          estado: data.estado || prev.endereco.estado,
          cidade: data.cidade || prev.endereco.cidade,
          bairro: data.bairro || prev.endereco.bairro,
          logradouro: data.logradouro || prev.endereco.logradouro,
        },
      }));

      // Se o CEP trouxe um estado, prefetch cidades para esse estado
      if (data.estado) {
        void (async () => {
          try {
            const estados =
              estadoOptions.length === 0 ? await fetchEstados() : estadoOptions;
            const found = estados.find((s: any) => s.value === data.estado);
            if (found) await fetchCidadesForEstado(found.id, found.value);
          } catch {
            // ignore
          }
        })();
      }
    } catch (error) {
      setCepError(error instanceof Error ? error.message : "Erro ao buscar CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  // Busca de estados (IBGE) e cidades por estado (IBGE)
  const fetchEstados = async () => {
    if (estadoOptions.length > 0) return estadoOptions;
    setEstadosLoading(true);
    try {
      const res = await fetch(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados",
      );
      if (!res.ok) throw new Error("Erro ao buscar estados");
      const data = await res.json();
      const mapped = data
        .map((s: any) => ({ id: s.id, value: s.sigla, label: `${s.nome} (${s.sigla})` }))
        .sort((a: any, b: any) => a.label.localeCompare(b.label));
      setEstadoOptions(mapped);
      return mapped;
    } catch (err) {
      // falha silenciosa
      return [];
    } finally {
      setEstadosLoading(false);
    }
  };

  const fetchCidadesForEstado = async (estadoId: number, uf: string) => {
    if (cidadeOptionsMap[uf]) return;
    setCidadesLoading(true);
    try {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`,
      );
      if (!res.ok) throw new Error("Erro ao buscar cidades");
      const data = await res.json();
      const mapped = data.map((c: any) => ({ value: c.nome, label: c.nome }));
      setCidadeOptionsMap((prev) => ({ ...prev, [uf]: mapped }));
    } catch (err) {
      // ignore
    } finally {
      setCidadesLoading(false);
    }
  };

  useEffect(() => {
    if (!formData.endereco.estado) return;

    setCidadeQuery("");

    void (async () => {
      try {
        let found = estadoOptions.find((s) => s.value === formData.endereco.estado);
        if (!found) {
          const estados = await fetchEstados();
          found = estados.find((s: any) => s.value === formData.endereco.estado);
        }
        if (found) await fetchCidadesForEstado(found.id, found.value);
      } catch {
        // ignore
      }
    })();
  }, [formData.endereco.estado]);

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

  const filteredEstadoOptions = estadoOptions.filter((s) => {
    const q = estadoQuery.trim().toLowerCase();
    if (!q) return true;
    return s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q);
  });

  const cidadesForEstado = cidadeOptionsMap[formData.endereco.estado] || [];
  const filteredCidadeOptions = cidadesForEstado.filter((c) => {
    const q = cidadeQuery.trim().toLowerCase();
    if (!q) return true;
    return c.label.toLowerCase().includes(q);
  });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          {cepLoading && (
            <div className="mb-4 text-sm text-slate-600">
              Buscando endereço por CEP...
            </div>
          )}

          {cepError && (
            <div className="mb-4 text-sm text-destructive-foreground">{cepError}</div>
          )}

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
                  onChange={(e) => handleChange("cpf", formatCpf(e.target.value))}
                  inputMode="numeric"
                  maxLength={14}
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
                  onChange={(e) => handleChange("telefone", formatPhone(e.target.value))}
                  inputMode="tel"
                  maxLength={15}
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
              <Field>
                <FieldLabel htmlFor="cep">CEP</FieldLabel>
                <Input
                  id="cep"
                  value={formData.endereco.cep}
                  onChange={(e) => {
                    const formatted = formatCep(e.target.value);
                    handleChange("endereco.cep", formatted);

                    const clean = onlyDigits(formatted);
                    if (clean.length === 8) {
                      void lookupCep(clean);
                    } else {
                      // limpa erro se deixou de ter 8 dígitos
                      setCepError(null);
                    }
                  }}
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="00000-000"
                />
              </Field>

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
                <FieldLabel htmlFor="estado">Estado</FieldLabel>
                <Popover open={estadoOpen} onOpenChange={setEstadoOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="estado"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={estadoOpen}
                      onClick={() => void fetchEstados()}
                      className="w-full justify-between"
                    >
                      <span className="truncate">
                        {estadoOptions.find((s) => s.value === formData.endereco.estado)
                          ?.label ||
                          formData.endereco.estado ||
                          "Selecione um estado"}
                      </span>
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder="Buscar estado por nome ou UF"
                        value={estadoQuery}
                        onValueChange={setEstadoQuery}
                      />
                      <CommandList>
                        {estadosLoading ? (
                          <div className="p-3 text-sm text-muted-foreground">
                            Carregando estados...
                          </div>
                        ) : (
                          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                        )}
                        {!estadosLoading && (
                          <CommandGroup>
                            {filteredEstadoOptions.map((opt) => (
                              <CommandItem
                                key={opt.value}
                                value={opt.label}
                                onSelect={async () => {
                                  handleChange("endereco.estado", opt.value);
                                  // Ao alterar o estado, limpa a cidade
                                  handleChange("endereco.cidade", "");
                                  setCidadeQuery("");
                                  setEstadoOpen(false);
                                  let found = estadoOptions.find(
                                    (s) => s.value === opt.value,
                                  );
                                  if (!found) {
                                    const estados = await fetchEstados();
                                    found = estados.find(
                                      (s: any) => s.value === opt.value,
                                    );
                                  }
                                  if (found)
                                    await fetchCidadesForEstado(found.id, found.value);
                                }}
                              >
                                <Check
                                  className={
                                    formData.endereco.estado === opt.value
                                      ? "mr-2 size-4 opacity-100"
                                      : "mr-2 size-4 opacity-0"
                                  }
                                />
                                {opt.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <FieldLabel htmlFor="cidade">Cidade</FieldLabel>
                <Popover open={cidadeOpen} onOpenChange={setCidadeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="cidade"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={cidadeOpen}
                      disabled={!formData.endereco.estado}
                      onClick={() => {
                        if (!formData.endereco.estado) return;
                        const estadoSelecionado = estadoOptions.find(
                          (s) => s.value === formData.endereco.estado,
                        );
                        if (estadoSelecionado) {
                          void fetchCidadesForEstado(
                            estadoSelecionado.id,
                            estadoSelecionado.value,
                          );
                        }
                      }}
                      className="w-full justify-between"
                    >
                      <span className="truncate">
                        {formData.endereco.cidade || "Selecione uma cidade"}
                      </span>
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput
                        placeholder={
                          formData.endereco.estado
                            ? "Buscar cidade..."
                            : "Selecione um estado primeiro"
                        }
                        value={cidadeQuery}
                        onValueChange={setCidadeQuery}
                        disabled={!formData.endereco.estado}
                      />
                      <CommandList>
                        {cidadesLoading ? (
                          <div className="p-3 text-sm text-muted-foreground">
                            Carregando cidades...
                          </div>
                        ) : (
                          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                        )}
                        {!cidadesLoading && (
                          <CommandGroup>
                            {filteredCidadeOptions.map((opt) => (
                              <CommandItem
                                key={opt.value}
                                value={opt.label}
                                onSelect={() => {
                                  handleChange("endereco.cidade", opt.value);
                                  setCidadeOpen(false);
                                  setCidadeQuery("");
                                }}
                              >
                                <Check
                                  className={
                                    formData.endereco.cidade === opt.value
                                      ? "mr-2 size-4 opacity-100"
                                      : "mr-2 size-4 opacity-0"
                                  }
                                />
                                {opt.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
