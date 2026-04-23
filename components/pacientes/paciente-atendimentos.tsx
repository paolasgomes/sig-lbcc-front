'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Empty } from '@/components/ui/empty'
import { useData } from '@/contexts/data-context'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PacienteAtendimentosProps {
  pacienteId: string
}

export function PacienteAtendimentos({ pacienteId }: PacienteAtendimentosProps) {
  const { getAtendimentosByPaciente, getAreaById, getCotacaoById } = useData()
  const atendimentos = getAtendimentosByPaciente(pacienteId).sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  )

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Atendimentos</CardTitle>
          <CardDescription>Registros de atendimentos do paciente</CardDescription>
        </div>
        <Button asChild>
          <Link href={`/atendimentos/novo?pacienteId=${pacienteId}`}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Atendimento
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {atendimentos.length === 0 ? (
          <Empty
            title="Nenhum atendimento registrado"
            description="Os atendimentos realizados para este paciente aparecerão aqui."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Cotação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atendimentos.map(atendimento => {
                const area = getAreaById(atendimento.areaAtendimentoId)
                const cotacao = atendimento.cotacaoId ? getCotacaoById(atendimento.cotacaoId) : null

                return (
                  <TableRow key={atendimento.id}>
                    <TableCell>{formatDate(atendimento.data)}</TableCell>
                    <TableCell>{area?.nome || '-'}</TableCell>
                    <TableCell>{atendimento.tipoAtendimento}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {atendimento.descricao}
                    </TableCell>
                    <TableCell>
                      {cotacao ? (
                        <Link
                          href={`/cotacoes/${cotacao.id}`}
                          className="text-primary hover:underline"
                        >
                          Ver cotação
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
