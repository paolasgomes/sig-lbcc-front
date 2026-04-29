"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { useData } from "@/contexts/data-context";
import type { Produto } from "@/types";

interface ProdutoFormProps {
  produto?: Produto;
  modo?: "criar" | "editar";
}

export function ProdutoForm({ produto, modo = "criar" }: ProdutoFormProps) {
  const router = useRouter();
  const { addProduto, updateProduto } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: produto?.nome || produto?.descricao || "",
    descricao: produto?.descricao || "",
    unidade: produto?.unidade || produto?.unidadeMedida || "UN",
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (modo === "criar") {
        const novo = await addProduto({
          nome: formData.nome,
          descricao: formData.descricao,
          unidade: formData.unidade,
          ativo: true,
        });

        router.push(`/produtos/${novo.id}`);
      } else if (produto) {
        await updateProduto(produto.id, {
          nome: formData.nome,
          descricao: formData.descricao,
          unidade: formData.unidade,
        });

        router.push(`/produtos/${produto.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{modo === "criar" ? "Novo Produto" : "Editar Produto"}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Nome *</FieldLabel>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </Field>

            <Field>
              <FieldLabel>Descrição</FieldLabel>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </Field>

            <Field>
              <FieldLabel>Unidade</FieldLabel>
              <select
                value={formData.unidade}
                onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="UN">Unidade (UN)</option>
                <option value="CX">Caixa (CX)</option>
                <option value="PCT">Pacote (PCT)</option>
                <option value="FR">Frasco (FR)</option>
                <option value="AMP">Ampola (AMP)</option>
                <option value="ML">Mililitro (ML)</option>
                <option value="MG">Miligrama (MG)</option>
                <option value="SESSAO">Sessao</option>
                <option value="CONSULTA">Consulta</option>
              </select>
            </Field>
          </FieldGroup>

          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.nome}>
              {loading ? "Salvando..." : modo === "criar" ? "Cadastrar" : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default ProdutoForm;
