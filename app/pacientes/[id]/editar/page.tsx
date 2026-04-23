'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PacienteForm } from '@/components/pacientes/paciente-form'
import { useData } from '@/contexts/data-context'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditarPacientePage({ params }: PageProps) {
  const { id } = use(params)
  const { getPacienteById } = useData()
  const paciente = getPacienteById(id)

  if (!paciente) {
    notFound()
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/pacientes/${paciente.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Editar Paciente</h1>
            <p className="text-muted-foreground">{paciente.nomeCompleto}</p>
          </div>
        </div>

        <PacienteForm paciente={paciente} modo="editar" />
      </div>
    </DashboardLayout>
  )
}
