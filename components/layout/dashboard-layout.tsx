'use client'

import { AppSidebar } from './app-sidebar'
import { AppHeader } from './app-header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { PerfilUsuario } from '@/types'

interface DashboardLayoutProps {
  children: React.ReactNode
  perfisPermitidos?: PerfilUsuario[]
  allowedRoles?: string[]
}

export function DashboardLayout({ children, perfisPermitidos, allowedRoles }: DashboardLayoutProps) {
  return (
    <ProtectedRoute perfisPermitidos={perfisPermitidos} allowedRoles={allowedRoles}>
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
