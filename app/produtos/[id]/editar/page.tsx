"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProdutoForm } from "@/components/produtos/produto-form";
import { useData } from "@/contexts/data-context";

interface EditarProdutoPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarProdutoPage({ params }: EditarProdutoPageProps) {
  const { id } = use(params);
  const { produtos } = useData();
  const produto = produtos.find((p) => p.id === id);

  if (!produto) {
    notFound();
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "gestor"]}>
      <DashboardLayout>
        <ProdutoForm produto={produto} modo="editar" />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
