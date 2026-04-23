"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useData } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { ArrowLeft, Pencil, User, MapPin, Calendar, FileText, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AtendimentoDetailPageProps {
  params: Promise<{ id: string }>
}

export default function AtendimentoDetailPage({ params }: AtendimentoDetailPageProps) {
  const { id } = use(params)
  const { atendimentos, pacientes, areas, usuarios, updateAtendimento } = useData()
  const atendimento = atendimentos.find(a => a.id === id)

  if (!atendimento) {
    notFound()
  }

  const paciente = pacientes.find(p => p.id === atendimento.pacienteId)
  const area = areas.find(a => a.id === atendimento.areaId)
  const responsavel = usuarios.find(u => u.id === atendimento.responsavelId)

  const handleConcluir = () => {
    if (confirm("Tem certeza que deseja concluir este atendimento?")) {
      updateAtendimento(atendimento.id, { status: "concluido" })
    }
  }

  const handleCancelar = () => {
    if (confirm("Tem certeza que deseja cancelar este atendimento?")) {
      updateAtendimento(atendimento.id, { status: "cancelado" })
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      consulta: "Consulta",
      exame: "Exame",
      procedimento: "Procedimento",
      retorno: "Retorno",
      acompanhamento: "Acompanhamento"
    }
    return labels[tipo] || tipo
  }

  const canEdit = atendimento.status !== "concluido" && atendimento.status !== "cancelado"

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor", "atendente"]}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/atendimentos">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">
                    Atendimento #{atendimento.id.slice(0, 8).toUpperCase()}
                  </h1>
                  <StatusBadge status={atendimento.status} type="atendimento" />
                </div>
                <p className="text-muted-foreground">
                  {getTipoLabel(atendimento.tipo)} - {format(new Date(atendimento.dataHora), "dd 'de' MMMM 'de' yyyy 'as' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/atendimentos/${atendimento.id}/editar`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleCancelar} className="text-destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                {atendimento.status === "em_andamento" && (
                  <Button onClick={handleConcluir}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Concluir
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Paciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paciente ? (
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/pacientes/${paciente.id}`}
                      className="font-medium hover:underline"
                    >
                      {paciente.nome}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      CPF: {paciente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                    </p>
                    {paciente.telefone && (
                      <p className="text-sm text-muted-foreground">
                        Tel: {paciente.telefone}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Paciente nao encontrado</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Area de Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {area ? (
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{area.nome}</p>
                    <p className="text-sm text-muted-foreground">{area.descricao}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Area nao encontrada</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Detalhes
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span>{getTipoLabel(atendimento.tipo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data/Hora:</span>
                  <span>{format(new Date(atendimento.dataHora), "dd/MM/yyyy HH:mm")}</span>
                </div>
                {responsavel && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Responsavel:</span>
                    <span>{responsavel.nome}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Descricao
                </CardTitle>
              </CardHeader>
              <CardContent>
                {atendimento.descricao ? (
                  <p className="whitespace-pre-wrap">{atendimento.descricao}</p>
                ) : (
                  <p className="text-muted-foreground">Nenhuma descricao registrada.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {atendimento.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observacoes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">{atendimento.observacoes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
