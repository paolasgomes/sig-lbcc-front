"use client";

import { ProdutoForm } from "@/components/produtos/produto-form";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function NovoProdutoPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "gestor"]}>
      <DashboardLayout>
        <ProdutoForm modo="criar" />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
