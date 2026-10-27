"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { useData } from "@/contexts/data-context";
import type { Produto } from "@/types";
import { useAreas } from "@/hooks/use-areas";

interface ProdutoFormProps {
  produto?: Produto;
  modo?: "criar" | "editar";
}

export function ProdutoForm({ produto, modo = "criar" }: ProdutoFormProps) {
  const router = useRouter();
  const { addProduto, updateProduto } = useData();
  const { areas, isLoading: areasLoading } = useAreas();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: produto?.nome || produto?.descricao || "",
    descricao: produto?.descricao || "",
    unidade: produto?.unidade || produto?.unidadeMedida || "UN",
  });

  const [areasSelecionadas, setAreasSelecionadas] = useState<string[]>(
    produto?.areas_ids ?? [],
  );

  useEffect(() => {
    setAreasSelecionadas(produto?.areas_ids ?? []);
  }, [produto?.id, produto?.areas_ids]);

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
          areas_ids: areasSelecionadas,
        });

        router.push(`/produtos/${novo.id}`);
      } else if (produto) {
        await updateProduto(produto.id, {
          nome: formData.nome,
          descricao: formData.descricao,
          unidade: formData.unidade,
          areas_ids: areasSelecionadas,
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
            <Field>
              <FieldLabel>Áreas de atendimento *</FieldLabel>

              {areasLoading ? (
                <p className="text-sm text-muted-foreground">
                  Carregando áreas...
                </p>
              ) : areas.filter((area) => area.ativa).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma área ativa cadastrada.
                </p>
              ) : (
                <div className="flex flex-col gap-3 rounded-md border p-3">
                  {areas
                    .filter((area) => area.ativa)
                    .map((area) => (
                      <label
                        key={area.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={areasSelecionadas.includes(area.id)}
                          onChange={(e) => {
                            setAreasSelecionadas((atuais) =>
                              e.target.checked
                                ? [...atuais, area.id]
                                : atuais.filter((id) => id !== area.id),
                            );
                          }}
                          className="h-4 w-4"
                        />
                        {area.nome} ({area.tipo_ordem})
                      </label>
                    ))}
                </div>
              )}
            </Field>
          </FieldGroup>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Não foi possível salvar o produto</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.nome.trim() ||
                areasSelecionadas.length === 0 ||
                areasLoading
              }
            >
              {loading ? "Salvando..." : modo === "criar" ? "Cadastrar" : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default ProdutoForm;
