"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import Image from "next/image";
import Logo from "@/public/lbcc-logo.svg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const sucesso = await login(email, senha);
      if (sucesso) {
        router.push("/dashboard");
      } else {
        setErro("Email ou senha inválidos");
      }
    } catch {
      setErro("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex  items-center justify-center rounded-xl">
            <Image src={Logo} alt="Logo LBCC" width={192} height={192} loading="eager" />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="senha">Senha</FieldLabel>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {mostrarSenha ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </Field>

              {erro && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {erro}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </FieldGroup>
          </form>

          <div className="mt-6 border-t pt-6">
            <p className="mb-3 text-center text-sm text-muted-foreground">
              Usuários de demonstração:
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="rounded-lg bg-muted p-2">
                <p>
                  <strong>Operador:</strong> operador@lbcc.org.br
                </p>
                <p>
                  <strong>Gestor:</strong> gestor@lbcc.org.br
                </p>
                <p>
                  <strong>Prefeitura:</strong> prefeitura@bataguassu.gov.br
                </p>
                <p className="mt-1">
                  <strong>Senha:</strong> 123456
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
