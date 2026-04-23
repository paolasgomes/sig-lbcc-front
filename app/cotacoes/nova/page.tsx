"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { CotacaoForm } from "@/components/cotacoes/cotacao-form"

export default function NovaCotacaoPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "gestor", "atendente"]}>
      <DashboardLayout>
        <CotacaoForm />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
