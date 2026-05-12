"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type { Fornecedor } from "@/types";
import { formatCep, formatCnpj, formatPhone } from "@/lib/formatters";

interface FornecedorFormProps {
  fornecedor?: Fornecedor;
  isEditing?: boolean;
}

const UF_OPTIONS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export function FornecedorForm({ fornecedor, isEditing }: FornecedorFormProps) {
  const router = useRouter();
  const { addFornecedor, updateFornecedor } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    razaoSocial: fornecedor?.razaoSocial || "",
    nomeFantasia: fornecedor?.nomeFantasia || "",
    cnpj: fornecedor?.cnpj ? formatCnpj(fornecedor.cnpj) : "",
    inscricaoEstadual: fornecedor?.inscricaoEstadual || "",
    telefone: fornecedor?.telefone ? formatPhone(fornecedor.telefone) : "",
    email: fornecedor?.email || "",
    endereco: fornecedor?.endereco || "",
    numero: fornecedor?.numero || "",
    complemento: fornecedor?.complemento || "",
    bairro: fornecedor?.bairro || "",
    cidade: fornecedor?.cidade || "",
    uf: fornecedor?.uf || "MS",
    cep: fornecedor?.cep ? formatCep(fornecedor.cep) : "",
    contato: fornecedor?.contato || "",
    telefoneContato: fornecedor?.telefoneContato
      ? formatPhone(fornecedor.telefoneContato)
      : "",
    ativo: fornecedor?.ativo ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditing && fornecedor) {
        await Promise.resolve(updateFornecedor(fornecedor.id, formData));
      } else {
        await Promise.resolve(addFornecedor(formData));
      }

      router.push("/fornecedores");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Erro ao salvar fornecedor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" asChild>
          <Link href="/fornecedores">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Atualize as informacoes do fornecedor"
              : "Cadastre um novo fornecedor no sistema"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
          <CardDescription>Informacoes legais do fornecedor</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel>Razao Social *</FieldLabel>
              <Input
                value={formData.razaoSocial}
                onChange={(e) => handleChange("razaoSocial", e.target.value)}
                required
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Nome Fantasia *</FieldLabel>
              <Input
                value={formData.nomeFantasia}
                onChange={(e) => handleChange("nomeFantasia", e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel>CNPJ *</FieldLabel>
              <Input
                value={formData.cnpj}
                onChange={(e) => handleChange("cnpj", formatCnpj(e.target.value))}
                inputMode="numeric"
                maxLength={18}
                placeholder="00.000.000/0000-00"
                required
              />
            </Field>
            <Field>
              <FieldLabel>Inscricao Estadual</FieldLabel>
              <Input
                value={formData.inscricaoEstadual}
                onChange={(e) => handleChange("inscricaoEstadual", e.target.value)}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
          <CardDescription>Informacoes de contato do fornecedor</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Telefone *</FieldLabel>
              <Input
                value={formData.telefone}
                onChange={(e) => handleChange("telefone", formatPhone(e.target.value))}
                inputMode="tel"
                maxLength={15}
                placeholder="(00) 00000-0000"
                required
              />
            </Field>
            <Field>
              <FieldLabel>E-mail *</FieldLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Pessoa de Contato</FieldLabel>
              <Input
                value={formData.contato}
                onChange={(e) => handleChange("contato", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Telefone do Contato</FieldLabel>
              <Input
                value={formData.telefoneContato}
                onChange={(e) =>
                  handleChange("telefoneContato", formatPhone(e.target.value))
                }
                inputMode="tel"
                maxLength={15}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereco</CardTitle>
          <CardDescription>Localizacao do fornecedor</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-6">
            <Field className="sm:col-span-2">
              <FieldLabel>CEP *</FieldLabel>
              <Input
                value={formData.cep}
                onChange={(e) => handleChange("cep", formatCep(e.target.value))}
                inputMode="numeric"
                maxLength={9}
                placeholder="00000-000"
                required
              />
            </Field>
            <Field className="sm:col-span-4">
              <FieldLabel>Endereco *</FieldLabel>
              <Input
                value={formData.endereco}
                onChange={(e) => handleChange("endereco", e.target.value)}
                required
              />
            </Field>
            <Field className="sm:col-span-1">
              <FieldLabel>Numero *</FieldLabel>
              <Input
                value={formData.numero}
                onChange={(e) => handleChange("numero", e.target.value)}
                required
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Complemento</FieldLabel>
              <Input
                value={formData.complemento}
                onChange={(e) => handleChange("complemento", e.target.value)}
              />
            </Field>
            <Field className="sm:col-span-3">
              <FieldLabel>Bairro *</FieldLabel>
              <Input
                value={formData.bairro}
                onChange={(e) => handleChange("bairro", e.target.value)}
                required
              />
            </Field>
            <Field className="sm:col-span-4">
              <FieldLabel>Cidade *</FieldLabel>
              <Input
                value={formData.cidade}
                onChange={(e) => handleChange("cidade", e.target.value)}
                required
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>UF *</FieldLabel>
              <select
                value={formData.uf}
                onChange={(e) => handleChange("uf", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                {UF_OPTIONS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Field className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => handleChange("ativo", e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <FieldLabel htmlFor="ativo" className="mb-0">
              Fornecedor ativo
            </FieldLabel>
          </Field>
        </CardContent>
      </Card>

      {submitError && (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível salvar o fornecedor</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/fornecedores">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting
            ? "Salvando..."
            : isEditing
              ? "Salvar Alteracoes"
              : "Cadastrar Fornecedor"}
        </Button>
      </div>
    </form>
  );
}
