"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useData } from "@/contexts/data-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { ArrowLeft, Save, Play, CheckCircle } from "lucide-react"
import Link from "next/link"
import type { Atendimento } from "@/types"

interface AtendimentoFormProps {
  atendimento?: Atendimento
  isEditing?: boolean
}

export function AtendimentoForm({ atendimento, isEditing }: AtendimentoFormProps) {
  const router = useRouter()
  const { pacientes, areas, addAtendimento, updateAtendimento } = useData()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    pacienteId: atendimento?.pacienteId || "",
    areaId: atendimento?.areaId || "",
    tipo: atendimento?.tipo || "consulta",
    dataHora: atendimento?.dataHora 
      ? new Date(atendimento.dataHora).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    descricao: atendimento?.descricao || "",
    observacoes: atendimento?.observacoes || "",
    status: atendimento?.status || "agendado"
  })

  const handleSubmit = (status?: string) => {
    if (!formData.pacienteId || !formData.areaId) {
      alert("Preencha todos os campos obrigatorios.")
      return
    }

    const atendimentoData = {
      ...formData,
      status: status || formData.status,
      responsavelId: user?.id || "",
      dataHora: new Date(formData.dataHora).toISOString()
    }

    if (isEditing && atendimento) {
      updateAtendimento(atendimento.id, atendimentoData)
    } else {
      addAtendimento(atendimentoData)
    }

    router.push("/atendimentos")
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const pacientesAtivos = pacientes.filter(p => p.status === "ativo")
  const areasAtivas = areas.filter(a => a.ativa)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" asChild>
          <Link href="/atendimentos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Atendimento" : "Novo Atendimento"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? "Atualize as informacoes do atendimento"
              : "Registre um novo atendimento no sistema"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informacoes do Atendimento</CardTitle>
          <CardDescription>Dados basicos do atendimento</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Paciente *</FieldLabel>
              <select
                value={formData.pacienteId}
                onChange={(e) => handleChange("pacienteId", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Selecione um paciente...</option>
                {pacientesAtivos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel>Area de Atendimento *</FieldLabel>
              <select
                value={formData.areaId}
                onChange={(e) => handleChange("areaId", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Selecione uma area...</option>
                {areasAtivas.map(a => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel>Tipo de Atendimento *</FieldLabel>
              <select
                value={formData.tipo}
                onChange={(e) => handleChange("tipo", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="consulta">Consulta</option>
                <option value="exame">Exame</option>
                <option value="procedimento">Procedimento</option>
                <option value="retorno">Retorno</option>
                <option value="acompanhamento">Acompanhamento</option>
              </select>
            </Field>
            <Field>
              <FieldLabel>Data e Hora *</FieldLabel>
              <Input
                type="datetime-local"
                value={formData.dataHora}
                onChange={(e) => handleChange("dataHora", e.target.value)}
                required
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Descricao</FieldLabel>
              <Textarea
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                placeholder="Descreva o atendimento realizado..."
                rows={3}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Observacoes</FieldLabel>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                placeholder="Observacoes adicionais..."
                rows={2}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/atendimentos">Cancelar</Link>
        </Button>
        {!isEditing && (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSubmit("agendado")}
              disabled={!formData.pacienteId || !formData.areaId}
            >
              <Save className="mr-2 h-4 w-4" />
              Agendar
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit("em_andamento")}
              disabled={!formData.pacienteId || !formData.areaId}
            >
              <Play className="mr-2 h-4 w-4" />
              Iniciar Atendimento
            </Button>
          </>
        )}
        {isEditing && (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSubmit()}
              disabled={!formData.pacienteId || !formData.areaId}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
            {formData.status === "em_andamento" && (
              <Button
                type="button"
                onClick={() => handleSubmit("concluido")}
                disabled={!formData.pacienteId || !formData.areaId}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Concluir Atendimento
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
