"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { FornecedorForm } from "@/components/fornecedores/fornecedor-form"

export default function NovoFornecedorPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "gestor"]}>
      <DashboardLayout>
        <FornecedorForm />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
