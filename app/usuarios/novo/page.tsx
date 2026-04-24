"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { UsuarioForm } from "@/components/usuarios/usuario-form";

export default function NovoUsuarioPage() {
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
            <h1 className="text-2xl font-bold text-foreground">Novo Usuário</h1>
            <p className="text-muted-foreground">
              Preencha os dados para cadastrar um novo usuário
            </p>
          </div>
        </div>

        <UsuarioForm />
      </div>
    </DashboardLayout>
  );
}
