"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AtendimentoForm } from "@/components/atendimentos/atendimento-form"
import { useData } from "@/contexts/data-context"

interface EditarAtendimentoPageProps {
  params: Promise<{ id: string }>
}

export default function EditarAtendimentoPage({ params }: EditarAtendimentoPageProps) {
  const { id } = use(params)
  const { atendimentos } = useData()
  const atendimento = atendimentos.find(a => a.id === id)

  if (!atendimento) {
    notFound()
  }

  if (atendimento.status === "concluido" || atendimento.status === "cancelado") {
    notFound()
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor", "atendente"]}>
      <DashboardLayout>
        <AtendimentoForm atendimento={atendimento} isEditing />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
