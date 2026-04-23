'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import { useData } from '@/contexts/data-context'
import { TipoEvento } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, UserPlus, RefreshCw, ClipboardList, Activity, File } from 'lucide-react'

interface PacienteHistoricoProps {
  pacienteId: string
}

const tipoEventoConfig: Record<TipoEvento, { icon: React.ElementType; color: string }> = {
  [TipoEvento.CADASTRO]: { icon: UserPlus, color: 'bg-info/15 text-info' },
  [TipoEvento.ATUALIZACAO]: { icon: RefreshCw, color: 'bg-accent text-accent-foreground' },
  [TipoEvento.ATENDIMENTO]: { icon: ClipboardList, color: 'bg-success/15 text-success' },
  [TipoEvento.COTACAO]: { icon: FileText, color: 'bg-chart-1/15 text-chart-1' },
  [TipoEvento.STATUS]: { icon: Activity, color: 'bg-warning/15 text-warning' },
  [TipoEvento.DOCUMENTO]: { icon: File, color: 'bg-secondary text-secondary-foreground' }
}

export function PacienteHistorico({ pacienteId }: PacienteHistoricoProps) {
  const { getHistoricoByPaciente } = useData()
  const historico = getHistoricoByPaciente(pacienteId)

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  if (historico.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <Empty
            title="Nenhum registro no histórico"
            description="As ações realizadas para este paciente aparecerão aqui."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico do Paciente</CardTitle>
        <CardDescription>Registro de todas as ações e eventos relacionados ao paciente</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 h-full w-px bg-border" />

          <div className="flex flex-col gap-6">
            {historico.map(item => {
              const config = tipoEventoConfig[item.tipoEvento]
              const Icon = config.icon

              return (
                <div key={item.id} className="relative flex gap-4 pl-10">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full ${config.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 rounded-lg border bg-card p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium">{item.descricao}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(item.dataHora)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Por: {item.usuarioResponsavel}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
