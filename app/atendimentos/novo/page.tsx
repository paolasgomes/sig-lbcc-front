"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AtendimentoForm } from "@/components/atendimentos/atendimento-form"

export default function NovoAtendimentoPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "gestor", "atendente"]}>
      <DashboardLayout>
        <AtendimentoForm />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
