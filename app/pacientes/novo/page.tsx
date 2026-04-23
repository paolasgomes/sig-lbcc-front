'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PacienteForm } from '@/components/pacientes/paciente-form'

export default function NovoPacientePage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pacientes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Novo Paciente</h1>
            <p className="text-muted-foreground">
              Preencha os dados para cadastrar um novo paciente
            </p>
          </div>
        </div>

        <PacienteForm modo="criar" />
      </div>
    </DashboardLayout>
  )
}
