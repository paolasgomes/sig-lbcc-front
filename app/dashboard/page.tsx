'use client'

import Link from 'next/link'
import {
  Users,
  ClipboardList,
  FileText,
  AlertTriangle,
  UserCheck,
  UserX,
  UserMinus,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useData } from '@/contexts/data-context'
import { useAuth } from '@/contexts/auth-context'

export default function DashboardPage() {
  const { getStats } = useData()
  const { podeVisualizarValores } = useAuth()
  const stats = getStats()

  const cards = [
    {
      title: 'Total de Pacientes',
      value: stats.totalPacientes,
      icon: Users,
      color: 'bg-chart-1',
      href: '/pacientes'
    },
    {
      title: 'Atendimentos',
      value: stats.totalAtendimentos,
      icon: ClipboardList,
      color: 'bg-chart-2',
      href: '/atendimentos'
    },
    {
      title: 'Cotações',
      value: stats.totalCotacoes,
      icon: FileText,
      color: 'bg-chart-3',
      href: '/cotacoes',
      hidden: !podeVisualizarValores()
    },
    {
      title: 'Cotações Vencidas',
      value: stats.cotacoesVencidas,
      icon: AlertTriangle,
      color: 'bg-warning',
      textColor: 'text-warning-foreground',
      href: '/cotacoes?status=expirada',
      hidden: !podeVisualizarValores()
    }
  ]

  const statusCards = [
    {
      title: 'Pacientes Ativos',
      value: stats.pacientesAtivos,
      icon: UserCheck,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Pacientes Suspensos',
      value: stats.pacientesSuspensos,
      icon: UserMinus,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    {
      title: 'Pacientes Encerrados',
      value: stats.pacientesEncerrados,
      icon: UserX,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted'
    }
  ]

  const quickLinks = [
    { label: 'Novo Paciente', href: '/pacientes/novo' },
    { label: 'Novo Atendimento', href: '/atendimentos/novo' },
    { label: 'Nova Cotação', href: '/cotacoes/nova', hidden: !podeVisualizarValores() },
    { label: 'Relatórios', href: '/relatorios' }
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de gestão da Liga de Combate ao Câncer
          </p>
        </div>

        {/* Cards principais */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards
            .filter(card => !card.hidden)
            .map(card => (
              <Link key={card.title} href={card.href}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.color}`}>
                      <card.icon className={`h-6 w-6 ${card.textColor || 'text-primary-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{card.title}</p>
                      <p className="text-2xl font-bold text-foreground">{card.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Status dos pacientes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Status dos Pacientes</CardTitle>
              <CardDescription>Distribuição por situação atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {statusCards.map(card => (
                  <div
                    key={card.title}
                    className={`flex items-center gap-4 rounded-lg p-4 ${card.bgColor}`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.bgColor}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{card.title}</p>
                      <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Atalhos rápidos */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Acesso rápido às principais funções</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {quickLinks
                .filter(link => !link.hidden)
                .map(link => (
                  <Button
                    key={link.label}
                    variant="outline"
                    className="justify-between"
                    asChild
                  >
                    <Link href={link.href}>
                      {link.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
