"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFornecedores } from "@/hooks/use-fornecedores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type { Fornecedor } from "@/types";
import { formatCnpj, formatPhone, onlyDigits } from "@/lib/formatters";

interface FornecedorFormProps {
  fornecedor?: Fornecedor;
  isEditing?: boolean;
}

export function FornecedorForm({ fornecedor, isEditing }: FornecedorFormProps) {
  const router = useRouter();
  const { criarFornecedor, atualizarFornecedor, alternarStatusFornecedor } =
    useFornecedores();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    razaoSocial: fornecedor?.razaoSocial ?? "",
    nomeFantasia: fornecedor?.nomeFantasia ?? "",
    cnpj: fornecedor?.cnpj ? formatCnpj(fornecedor.cnpj) : "",
    telefone: fornecedor?.telefone ? formatPhone(fornecedor.telefone) : "",
    email: fornecedor?.email ?? "",
    ativo: fornecedor?.ativo ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.razaoSocial.trim()) {
      setSubmitError("Razão social é obrigatória.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditing && fornecedor) {
        await atualizarFornecedor({
          id: fornecedor.id,
          dados: {
            nomeFantasia: formData.nomeFantasia || undefined,
            telefone: onlyDigits(formData.telefone) || undefined,
            email: formData.email || undefined,
          },
        });

        if (formData.ativo !== fornecedor.ativo) {
          await alternarStatusFornecedor(fornecedor.id);
        }
      } else {
        await criarFornecedor({
          razaoSocial: formData.razaoSocial.trim(),
          nomeFantasia: formData.nomeFantasia || undefined,
          cnpj: onlyDigits(formData.cnpj) || undefined,
          telefone: onlyDigits(formData.telefone) || undefined,
          email: formData.email || undefined,
          ativo: formData.ativo,
        });
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
              ? "Atualize as informações do fornecedor"
              : "Cadastre um novo fornecedor no sistema"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Fornecedor</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel>Razão Social *</FieldLabel>
              <Input
                value={formData.razaoSocial}
                onChange={(e) => handleChange("razaoSocial", e.target.value)}
                readOnly={isEditing}
                required={!isEditing}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Nome Fantasia</FieldLabel>
              <Input
                value={formData.nomeFantasia}
                onChange={(e) => handleChange("nomeFantasia", e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>CNPJ</FieldLabel>
              <Input
                value={formData.cnpj}
                onChange={(e) => handleChange("cnpj", formatCnpj(e.target.value))}
                inputMode="numeric"
                maxLength={18}
                placeholder="00.000.000/0000-00"
                readOnly={isEditing}
              />
            </Field>
            <Field>
              <FieldLabel>Telefone</FieldLabel>
              <Input
                value={formData.telefone}
                onChange={(e) => handleChange("telefone", formatPhone(e.target.value))}
                inputMode="tel"
                maxLength={15}
                placeholder="(00) 00000-0000"
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>E-mail</FieldLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </Field>
            <Field className="sm:col-span-2">
              <div className="flex items-center gap-2">
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
              </div>
            </Field>
          </FieldGroup>
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
              ? "Salvar Alterações"
              : "Cadastrar Fornecedor"}
        </Button>
      </div>
    </form>
  );
}
