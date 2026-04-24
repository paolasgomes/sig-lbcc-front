"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { UsuarioForm } from "@/components/usuarios/usuario-form";
import { useData } from "@/contexts/data-context";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditarUsuarioPage({ params }: PageProps) {
  const { id } = use(params);
  const { getUsuarioById } = useData();
  const usuario = getUsuarioById(id);

  if (!usuario) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/usuarios">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Editar Usuario</h1>
            <p className="text-muted-foreground">{usuario.nome}</p>
          </div>
        </div>

        <UsuarioForm usuario={usuario} isEditing />
      </div>
    </DashboardLayout>
  );
}
