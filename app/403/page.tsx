'use client'

import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground">403</h1>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Acesso Negado</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          Você não tem permissão para acessar esta página. Entre em contato com o administrador se acredita que isso é um erro.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/dashboard">Voltar ao Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Fazer Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
