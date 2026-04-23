import { StatusPaciente, StatusCotacao } from '@/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: StatusPaciente | StatusCotacao
  className?: string
}

const statusConfig = {
  // Status de Paciente
  [StatusPaciente.ATIVO]: {
    label: 'Ativo',
    className: 'bg-success/15 text-success border-success/30'
  },
  [StatusPaciente.SUSPENSO]: {
    label: 'Suspenso',
    className: 'bg-warning/15 text-warning border-warning/30'
  },
  [StatusPaciente.ENCERRADO]: {
    label: 'Encerrado',
    className: 'bg-muted text-muted-foreground border-border'
  },
  // Status de Cotação
  [StatusCotacao.PENDENTE]: {
    label: 'Pendente',
    className: 'bg-info/15 text-info border-info/30'
  },
  [StatusCotacao.VALIDA]: {
    label: 'Válida',
    className: 'bg-success/15 text-success border-success/30'
  },
  [StatusCotacao.EXPIRADA]: {
    label: 'Expirada',
    className: 'bg-destructive/15 text-destructive border-destructive/30'
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
