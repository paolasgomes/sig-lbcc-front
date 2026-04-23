"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useData } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { ArrowLeft, Save, Plus, Trash2, Send, FileText } from "lucide-react"
import Link from "next/link"
import type { Cotacao, ItemCotacao } from "@/types"

interface CotacaoFormProps {
  cotacao?: Cotacao
  isEditing?: boolean
}

export function CotacaoForm({ cotacao, isEditing }: CotacaoFormProps) {
  const router = useRouter()
  const { pacientes, produtos, fornecedores, addCotacao, updateCotacao } = useData()
  
  const [pacienteId, setPacienteId] = useState(cotacao?.pacienteId || "")
  const [observacoes, setObservacoes] = useState(cotacao?.observacoes || "")
  const [itens, setItens] = useState<Omit<ItemCotacao, "id">[]>(
    cotacao?.itens.map(i => ({
      produtoId: i.produtoId,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
      fornecedorId: i.fornecedorId,
      observacao: i.observacao
    })) || []
  )
  
  const [novoItem, setNovoItem] = useState({
    produtoId: "",
    quantidade: 1,
    fornecedorId: "",
    observacao: ""
  })

  const calcularTotal = () => {
    return itens.reduce((total, item) => total + (item.precoUnitario * item.quantidade), 0)
  }

  const handleAddItem = () => {
    if (!novoItem.produtoId || novoItem.quantidade <= 0) return
    
    const produto = produtos.find(p => p.id === novoItem.produtoId)
    if (!produto) return
    
    const itemToAdd: Omit<ItemCotacao, "id"> = {
      produtoId: novoItem.produtoId,
      quantidade: novoItem.quantidade,
      precoUnitario: produto.precoReferencia || 0,
      fornecedorId: novoItem.fornecedorId || undefined,
      observacao: novoItem.observacao || undefined
    }
    
    setItens([...itens, itemToAdd])
    setNovoItem({ produtoId: "", quantidade: 1, fornecedorId: "", observacao: "" })
  }

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const handleUpdateItemPrice = (index: number, price: number) => {
    const newItens = [...itens]
    newItens[index].precoUnitario = price
    setItens(newItens)
  }

  const handleSubmit = (enviar: boolean = false) => {
    if (!pacienteId || itens.length === 0) {
      alert("Selecione um paciente e adicione pelo menos um item.")
      return
    }

    const cotacaoData = {
      pacienteId,
      itens: itens.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        ...item
      })),
      valorTotal: calcularTotal(),
      observacoes,
      status: enviar ? "enviada" as const : "rascunho" as const
    }

    if (isEditing && cotacao) {
      updateCotacao(cotacao.id, cotacaoData)
    } else {
      addCotacao(cotacaoData)
    }

    router.push("/cotacoes")
  }

  const getProdutoNome = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId)
    return produto?.nome || "Produto nao encontrado"
  }

  const getProdutoUnidade = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId)
    return produto?.unidade || ""
  }

  const getFornecedorNome = (fornecedorId?: string) => {
    if (!fornecedorId) return "-"
    const fornecedor = fornecedores.find(f => f.id === fornecedorId)
    return fornecedor?.nomeFantasia || "-"
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  const pacientesAtivos = pacientes.filter(p => p.status === "ativo")
  const produtosAtivos = produtos.filter(p => p.ativo)
  const fornecedoresAtivos = fornecedores.filter(f => f.ativo)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" asChild>
          <Link href="/cotacoes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Cotacao" : "Nova Cotacao"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Atualize os itens e informacoes da cotacao"
              : "Crie uma nova cotacao de produtos e servicos"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Cotacao</CardTitle>
          <CardDescription>Selecione o paciente e adicione observacoes</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Paciente *</FieldLabel>
              <select
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Selecione um paciente...</option>
                {pacientesAtivos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Observacoes</FieldLabel>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observacoes gerais sobre a cotacao..."
                rows={2}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Item</CardTitle>
          <CardDescription>Selecione produtos e quantidades para a cotacao</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-12">
            <Field className="sm:col-span-4">
              <FieldLabel>Produto</FieldLabel>
              <select
                value={novoItem.produtoId}
                onChange={(e) => setNovoItem({ ...novoItem, produtoId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Selecione...</option>
                {produtosAtivos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} ({p.unidade})</option>
                ))}
              </select>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Quantidade</FieldLabel>
              <Input
                type="number"
                min="1"
                value={novoItem.quantidade}
                onChange={(e) => setNovoItem({ ...novoItem, quantidade: parseInt(e.target.value) || 1 })}
              />
            </Field>
            <Field className="sm:col-span-3">
              <FieldLabel>Fornecedor</FieldLabel>
              <select
                value={novoItem.fornecedorId}
                onChange={(e) => setNovoItem({ ...novoItem, fornecedorId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Selecione...</option>
                {fornecedoresAtivos.map(f => (
                  <option key={f.id} value={f.id}>{f.nomeFantasia}</option>
                ))}
              </select>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Obs.</FieldLabel>
              <Input
                value={novoItem.observacao}
                onChange={(e) => setNovoItem({ ...novoItem, observacao: e.target.value })}
                placeholder="Opcional"
              />
            </Field>
            <div className="sm:col-span-1 flex items-end">
              <Button
                type="button"
                onClick={handleAddItem}
                disabled={!novoItem.produtoId}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Itens da Cotacao
          </CardTitle>
          <CardDescription>
            {itens.length} item(ns) adicionado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {itens.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">
                Nenhum item adicionado. Use o formulario acima para adicionar itens.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Preco Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getProdutoNome(item.produtoId)}</p>
                          {item.observacao && (
                            <p className="text-xs text-muted-foreground">{item.observacao}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantidade} {getProdutoUnidade(item.produtoId)}
                      </TableCell>
                      <TableCell>{getFornecedorNome(item.fornecedorId)}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.precoUnitario}
                          onChange={(e) => handleUpdateItemPrice(index, parseFloat(e.target.value) || 0)}
                          className="w-28 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(item.precoUnitario * item.quantidade)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={4} className="text-right font-semibold">
                      Total:
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-lg">
                      {formatCurrency(calcularTotal())}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/cotacoes">Cancelar</Link>
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleSubmit(false)}
          disabled={itens.length === 0 || !pacienteId}
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar Rascunho
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={itens.length === 0 || !pacienteId}
        >
          <Send className="mr-2 h-4 w-4" />
          Enviar Cotacao
        </Button>
      </div>
    </div>
  )
}
