"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useData } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Package } from "lucide-react"
import type { Produto } from "@/types"

export default function ProdutosPage() {
  const { produtos, fornecedores, addProduto, updateProduto, deleteProduto } = useData()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    unidade: "UN",
    categoria: "",
    fornecedorId: "",
    precoReferencia: 0,
    ativo: true
  })

  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getFornecedorNome = (fornecedorId: string) => {
    const fornecedor = fornecedores.find(f => f.id === fornecedorId)
    return fornecedor?.nomeFantasia || "Nao informado"
  }

  const handleOpenDialog = (produto?: Produto) => {
    if (produto) {
      setEditingProduto(produto)
      setFormData({
        nome: produto.nome,
        descricao: produto.descricao,
        unidade: produto.unidade,
        categoria: produto.categoria,
        fornecedorId: produto.fornecedorId || "",
        precoReferencia: produto.precoReferencia || 0,
        ativo: produto.ativo
      })
    } else {
      setEditingProduto(null)
      setFormData({
        nome: "",
        descricao: "",
        unidade: "UN",
        categoria: "",
        fornecedorId: "",
        precoReferencia: 0,
        ativo: true
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (editingProduto) {
      updateProduto(editingProduto.id, formData)
    } else {
      addProduto(formData)
    }
    setIsDialogOpen(false)
    setEditingProduto(null)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduto(id)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor"]}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Produtos e Servicos</h1>
              <p className="text-muted-foreground">
                Gerencie o catalogo de produtos e servicos
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduto ? "Editar Produto" : "Novo Produto"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProduto
                      ? "Atualize as informacoes do produto"
                      : "Cadastre um novo produto ou servico"}
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup className="grid gap-4">
                  <Field>
                    <FieldLabel>Nome do Produto *</FieldLabel>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Descricao</FieldLabel>
                    <Textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      rows={2}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
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
                      <FieldLabel>Categoria</FieldLabel>
                      <Input
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                        placeholder="Ex: Medicamento, Servico..."
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Fornecedor</FieldLabel>
                      <select
                        value={formData.fornecedorId}
                        onChange={(e) => setFormData({ ...formData, fornecedorId: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Selecione...</option>
                        {fornecedores.filter(f => f.ativo).map(f => (
                          <option key={f.id} value={f.id}>{f.nomeFantasia}</option>
                        ))}
                      </select>
                    </Field>
                    <Field>
                      <FieldLabel>Preco Referencia</FieldLabel>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.precoReferencia}
                        onChange={(e) => setFormData({ ...formData, precoReferencia: parseFloat(e.target.value) || 0 })}
                      />
                    </Field>
                  </div>
                  <Field className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      className="h-4 w-4 rounded border-border"
                    />
                    <FieldLabel htmlFor="ativo" className="mb-0">Produto ativo</FieldLabel>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={!formData.nome}>
                    {editingProduto ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Catalogo de Produtos
              </CardTitle>
              <CardDescription>
                {produtos.length} produto(s) cadastrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Preco Ref.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProdutos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nenhum produto encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProdutos.map((produto) => (
                        <TableRow key={produto.id}>
                          <TableCell className="font-medium">{produto.nome}</TableCell>
                          <TableCell>{produto.categoria}</TableCell>
                          <TableCell>{produto.unidade}</TableCell>
                          <TableCell>{getFornecedorNome(produto.fornecedorId || "")}</TableCell>
                          <TableCell className="text-right font-mono">
                            {produto.precoReferencia ? formatCurrency(produto.precoReferencia) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={produto.ativo ? "default" : "secondary"}>
                              {produto.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Acoes</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDialog(produto)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(produto.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
