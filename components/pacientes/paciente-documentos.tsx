'use client'

import { useState } from 'react'
import { Plus, FileText, Trash2, Upload } from 'lucide-react'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Empty } from '@/components/ui/empty'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { useData } from '@/contexts/data-context'
import { useAuth } from '@/contexts/auth-context'
import { TipoEvento } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PacienteDocumentosProps {
  pacienteId: string
}

export function PacienteDocumentos({ pacienteId }: PacienteDocumentosProps) {
  const { getDocumentosByPaciente, addDocumento, removeDocumento, addHistorico } = useData()
  const { usuario } = useAuth()
  const documentos = getDocumentosByPaciente(pacienteId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [tipoDocumento, setTipoDocumento] = useState('')

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  const handleAddDocumento = () => {
    if (!nomeArquivo || !tipoDocumento) return

    const novoDocumento = {
      id: `doc-${Date.now()}`,
      pacienteId,
      nomeArquivo,
      tipo: tipoDocumento,
      dataUpload: new Date().toISOString().split('T')[0],
      tamanho: `${Math.floor(Math.random() * 500 + 50)} KB`
    }

    addDocumento(novoDocumento)
    addHistorico({
      id: `hist-${Date.now()}`,
      pacienteId,
      dataHora: new Date().toISOString(),
      tipoEvento: TipoEvento.DOCUMENTO,
      descricao: `Documento "${nomeArquivo}" anexado`,
      usuarioResponsavel: usuario?.nome || 'Sistema'
    })

    setNomeArquivo('')
    setTipoDocumento('')
    setDialogOpen(false)
  }

  const handleRemoveDocumento = (id: string) => {
    removeDocumento(id, usuario?.nome || 'Sistema', pacienteId)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Documentos</CardTitle>
          <CardDescription>Documentos anexados ao prontuário do paciente</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Anexar Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Anexar Documento</DialogTitle>
              <DialogDescription>
                Simule o upload de um documento para o prontuário do paciente.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nomeArquivo">Nome do Arquivo</FieldLabel>
                <Input
                  id="nomeArquivo"
                  value={nomeArquivo}
                  onChange={e => setNomeArquivo(e.target.value)}
                  placeholder="Ex: laudo_medico.pdf"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="tipoDocumento">Tipo de Documento</FieldLabel>
                <Input
                  id="tipoDocumento"
                  value={tipoDocumento}
                  onChange={e => setTipoDocumento(e.target.value)}
                  placeholder="Ex: Laudo Médico, Exame, Receita"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddDocumento} disabled={!nomeArquivo || !tipoDocumento}>
                <Upload className="mr-2 h-4 w-4" />
                Anexar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {documentos.length === 0 ? (
          <Empty
            title="Nenhum documento anexado"
            description="Os documentos do paciente aparecerão aqui."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data de Upload</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentos.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{doc.nomeArquivo}</span>
                    </div>
                  </TableCell>
                  <TableCell>{doc.tipo}</TableCell>
                  <TableCell>{formatDate(doc.dataUpload)}</TableCell>
                  <TableCell>{doc.tamanho}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remover</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover documento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O documento será removido permanentemente do prontuário.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveDocumento(doc.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
