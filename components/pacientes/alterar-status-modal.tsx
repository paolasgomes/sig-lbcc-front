'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { useData } from '@/contexts/data-context'
import { useAuth } from '@/contexts/auth-context'
import { StatusPaciente } from '@/types'

interface AlterarStatusModalProps {
  pacienteId: string
  statusAtual: StatusPaciente
}

const statusOptions = [
  { value: StatusPaciente.ATIVO, label: 'Ativo' },
  { value: StatusPaciente.SUSPENSO, label: 'Suspenso' },
  { value: StatusPaciente.ENCERRADO, label: 'Encerrado' }
]

export function AlterarStatusModal({ pacienteId, statusAtual }: AlterarStatusModalProps) {
  const { alterarStatusPaciente } = useData()
  const { usuario } = useAuth()
  const [open, setOpen] = useState(false)
  const [novoStatus, setNovoStatus] = useState<StatusPaciente>(statusAtual)

  const handleConfirm = () => {
    if (novoStatus !== statusAtual) {
      alterarStatusPaciente(pacienteId, novoStatus, usuario?.nome || 'Sistema')
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Alterar Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Status do Paciente</DialogTitle>
          <DialogDescription>
            Selecione o novo status para o paciente. Esta ação será registrada no histórico.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="status">Novo Status</FieldLabel>
            <Select value={novoStatus} onValueChange={v => setNovoStatus(v as StatusPaciente)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={novoStatus === statusAtual}>
            Confirmar Alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
