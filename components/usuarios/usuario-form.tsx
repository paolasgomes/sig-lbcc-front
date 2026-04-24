"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PerfilUsuario, type Usuario } from "@/types";

interface UsuarioFormProps {
  usuario?: Usuario;
  isEditing?: boolean;
}

type FormState = {
  nome: string;
  email: string;
  perfil: "" | PerfilUsuario;
  senha: string;
  confirmarSenha: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const PERFIS_DISPONIVEIS = [
  { value: PerfilUsuario.OPERADOR, label: "Operador" },
  { value: PerfilUsuario.GESTOR, label: "Gestor" },
  { value: PerfilUsuario.PREFEITURA, label: "Prefeitura" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UsuarioForm({ usuario, isEditing = false }: UsuarioFormProps) {
  const router = useRouter();
  const { addUsuario, updateUsuario } = useData();

  const [formData, setFormData] = useState<FormState>({
    nome: usuario?.nome ?? "",
    email: usuario?.email ?? "",
    perfil: usuario?.perfil ?? "",
    senha: "",
    confirmarSenha: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!formData.nome.trim()) {
      nextErrors.nome = "Nome e obrigatorio.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email e obrigatorio.";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      nextErrors.email = "Informe um email valido.";
    }

    if (!formData.perfil) {
      nextErrors.perfil = "Perfil e obrigatorio.";
    }

    const hasSenha = formData.senha.length > 0;

    if (!isEditing && !hasSenha) {
      nextErrors.senha = "Senha e obrigatoria na criacao.";
    }

    if (!formData.confirmarSenha && (!isEditing || hasSenha)) {
      nextErrors.confirmarSenha = "Confirme a senha.";
    }

    if (
      (hasSenha || formData.confirmarSenha) &&
      formData.senha !== formData.confirmarSenha
    ) {
      nextErrors.confirmarSenha = "As senhas devem ser iguais.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payloadBase = {
      nome: formData.nome.trim(),
      email: formData.email.trim(),
      perfil: formData.perfil as PerfilUsuario,
      ativo: usuario?.ativo ?? true,
    };

    if (isEditing && usuario) {
      const payload: Partial<Usuario> = {
        ...payloadBase,
      };

      if (formData.senha) {
        payload.senha = formData.senha;
      }

      updateUsuario(usuario.id, payload);
    } else {
      addUsuario({
        id: `usr-${Date.now()}`,
        ...payloadBase,
        senha: formData.senha,
      });
    }

    router.push("/usuarios");
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    if (field === "senha" && errors.confirmarSenha) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.confirmarSenha;
        return next;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card className="bg-background text-foreground">
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Usuario" : "Novo Usuario"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Atualize os dados do usuario."
              : "Preencha os campos para cadastrar um novo usuario."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="nome">Nome *</FieldLabel>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(event) => handleChange("nome", event.target.value)}
                className={cn(
                  errors.nome && "border-destructive focus-visible:ring-destructive/20",
                )}
                aria-invalid={Boolean(errors.nome)}
                required
              />
              <FieldError>{errors.nome}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email *</FieldLabel>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => handleChange("email", event.target.value)}
                className={cn(
                  errors.email && "border-destructive focus-visible:ring-destructive/20",
                )}
                aria-invalid={Boolean(errors.email)}
                required
              />
              <FieldError>{errors.email}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="perfil">Perfil *</FieldLabel>
              <Select
                value={formData.perfil}
                onValueChange={(value) => handleChange("perfil", value)}
              >
                <SelectTrigger
                  id="perfil"
                  className={cn(
                    "w-full",
                    errors.perfil &&
                      "border-destructive focus-visible:ring-destructive/20",
                  )}
                  aria-invalid={Boolean(errors.perfil)}
                >
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {PERFIS_DISPONIVEIS.map((perfil) => (
                    <SelectItem key={perfil.value} value={perfil.value}>
                      {perfil.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors.perfil}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="senha">Senha {!isEditing && "*"}</FieldLabel>
              <Input
                id="senha"
                type="password"
                value={formData.senha}
                onChange={(event) => handleChange("senha", event.target.value)}
                className={cn(
                  errors.senha && "border-destructive focus-visible:ring-destructive/20",
                )}
                aria-invalid={Boolean(errors.senha)}
                required={!isEditing}
              />
              <FieldError>{errors.senha}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmarSenha">Confirmar senha *</FieldLabel>
              <Input
                id="confirmarSenha"
                type="password"
                value={formData.confirmarSenha}
                onChange={(event) => handleChange("confirmarSenha", event.target.value)}
                className={cn(
                  errors.confirmarSenha &&
                    "border-destructive focus-visible:ring-destructive/20",
                )}
                aria-invalid={Boolean(errors.confirmarSenha)}
                required={!isEditing || Boolean(formData.senha)}
              />
              <FieldError>{errors.confirmarSenha}</FieldError>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4" />
          Salvar
        </Button>
      </div>
    </form>
  );
}
