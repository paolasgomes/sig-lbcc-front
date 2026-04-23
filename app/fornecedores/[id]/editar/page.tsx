"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { FornecedorForm } from "@/components/fornecedores/fornecedor-form"
import { useData } from "@/contexts/data-context"

interface EditarFornecedorPageProps {
  params: Promise<{ id: string }>
}

export default function EditarFornecedorPage({ params }: EditarFornecedorPageProps) {
  const { id } = use(params)
  const { fornecedores } = useData()
  const fornecedor = fornecedores.find(f => f.id === id)

  if (!fornecedor) {
    notFound()
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor"]}>
      <DashboardLayout>
        <FornecedorForm fornecedor={fornecedor} isEditing />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
