"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useData } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Pencil, Building2, Phone, Mail, MapPin, User } from "lucide-react"

interface FornecedorDetailPageProps {
  params: Promise<{ id: string }>
}

export default function FornecedorDetailPage({ params }: FornecedorDetailPageProps) {
  const { id } = use(params)
  const { fornecedores } = useData()
  const fornecedor = fornecedores.find(f => f.id === id)

  if (!fornecedor) {
    notFound()
  }

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
  }

  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return phone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
    }
    return phone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3")
  }

  const formatCEP = (cep: string) => {
    return cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor"]}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/fornecedores">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {fornecedor.nomeFantasia}
                  </h1>
                  <Badge variant={fornecedor.ativo ? "default" : "secondary"}>
                    {fornecedor.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{fornecedor.razaoSocial}</p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/fornecedores/${fornecedor.id}/editar`}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-mono">{formatCNPJ(fornecedor.cnpj)}</p>
                </div>
                {fornecedor.inscricaoEstadual && (
                  <div>
                    <p className="text-sm text-muted-foreground">Inscricao Estadual</p>
                    <p>{fornecedor.inscricaoEstadual}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{formatPhone(fornecedor.telefone)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{fornecedor.email}</span>
                </div>
                {fornecedor.contato && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {fornecedor.contato}
                      {fornecedor.telefoneContato && ` - ${formatPhone(fornecedor.telefoneContato)}`}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  {fornecedor.endereco}, {fornecedor.numero}
                  {fornecedor.complemento && ` - ${fornecedor.complemento}`}
                </p>
                <p>
                  {fornecedor.bairro} - {fornecedor.cidade}/{fornecedor.uf}
                </p>
                <p className="text-muted-foreground">CEP: {formatCEP(fornecedor.cep)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
