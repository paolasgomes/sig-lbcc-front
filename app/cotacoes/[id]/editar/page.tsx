"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { CotacaoForm } from "@/components/cotacoes/cotacao-form"
import { useData } from "@/contexts/data-context"

interface EditarCotacaoPageProps {
  params: Promise<{ id: string }>
}

export default function EditarCotacaoPage({ params }: EditarCotacaoPageProps) {
  const { id } = use(params)
  const { cotacoes } = useData()
  const cotacao = cotacoes.find(c => c.id === id)

  if (!cotacao) {
    notFound()
  }

  if (cotacao.status !== "rascunho") {
    notFound()
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor", "atendente"]}>
      <DashboardLayout>
        <CotacaoForm cotacao={cotacao} isEditing />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
