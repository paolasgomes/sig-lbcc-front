'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, Plus, Upload } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Empty } from '@/components/ui/empty'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { listarDocumentosPaciente, uploadDocumento } from '@/services/pacientes-service'
import { TipoEvento, type Documento } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PacienteDocumentosProps {
  pacienteId: string
}

const MAX_FILE_SIZE = 4 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx']
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ACCEPT_ATTRIBUTE =
  '.pdf,.png,.jpg,.jpeg,.doc,.docx,application/pdf,image/png,image/jpeg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(0)} KB`
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PacienteDocumentos({ pacienteId }: PacienteDocumentosProps) {
  const { addHistorico } = useData()
  const { usuario } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [tipoDocumento, setTipoDocumento] = useState('')

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const resetForm = useCallback(() => {
    setSelectedFile(null)
    setTipoDocumento('')
    clearFileInput()
  }, [])

  const carregarDocumentos = useCallback(async () => {
    setIsFetching(true)
    setFetchError(null)

    try {
      const documentosCarregados = await listarDocumentosPaciente(pacienteId)
      setDocumentos(documentosCarregados)
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : 'Erro ao carregar documentos do paciente.',
      )
    } finally {
      setIsFetching(false)
    }
  }, [pacienteId])

  useEffect(() => {
    void carregarDocumentos()
  }, [carregarDocumentos])

  const validarArquivo = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 4 MB.',
      })

      return false
    }

    const nomeArquivo = file.name.toLowerCase()
    const tipoAceito =
      ACCEPTED_MIME_TYPES.includes(file.type) ||
      ACCEPTED_EXTENSIONS.some((extensao) => nomeArquivo.endsWith(extensao))

    if (!tipoAceito) {
      toast({
        variant: 'destructive',
        title: 'Tipo de arquivo inválido',
        description: 'Envie um PDF, imagem ou documento Word compatível.',
      })

      return false
    }

    return true
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)

    if (!open) {
      resetForm()
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!validarArquivo(file)) {
      setSelectedFile(null)
      event.target.value = ''
      return
    }

    setSelectedFile(file)
  }

  const handleCancelarUpload = () => {
    resetForm()
    setDialogOpen(false)
  }

  const handleUploadDocumento = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedFile || !tipoDocumento.trim() || isLoading) {
      return
    }

    if (!validarArquivo(selectedFile)) {
      return
    }

    setIsLoading(true)

    try {
      await uploadDocumento(pacienteId, selectedFile, tipoDocumento.trim())

      const documentoTemporario: Documento = {
        id: `doc-${Date.now()}`,
        pacienteId,
        nomeArquivo: selectedFile.name,
        tipo: tipoDocumento.trim(),
        dataUpload: new Date().toISOString(),
        tamanho: formatFileSize(selectedFile.size),
      }

      setDocumentos((current) => [documentoTemporario, ...current])

      addHistorico({
        id: `hist-${Date.now()}`,
        pacienteId,
        dataHora: new Date().toISOString(),
        tipoEvento: TipoEvento.DOCUMENTO,
        descricao: `Documento "${selectedFile.name}" anexado`,
        usuarioResponsavel: usuario?.nome || 'Sistema',
      })

      await carregarDocumentos()

      toast({
        title: 'Documento anexado',
        description: `${selectedFile.name} foi enviado com sucesso.`,
      })

      setDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao anexar documento',
        description:
          error instanceof Error ? error.message : 'Não foi possível enviar o documento.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Documentos</CardTitle>
          <CardDescription>Documentos anexados ao prontuário do paciente</CardDescription>
        </div>

        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
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
                Envie um arquivo de até 4 MB para o prontuário do paciente.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUploadDocumento} className="grid gap-4">
              <FieldGroup className="grid gap-4">
                <Field>
                  <FieldLabel htmlFor="arquivoDocumento">Arquivo</FieldLabel>
                  <Input
                    ref={fileInputRef}
                    id="arquivoDocumento"
                    type="file"
                    accept={ACCEPT_ATTRIBUTE}
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    PDF, imagem ou documento Word, até 4 MB.
                  </p>
                  {selectedFile && (
                    <p className="mt-2 text-sm font-medium text-foreground">
                      Arquivo selecionado: {selectedFile.name}
                    </p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="tipoDocumento">Tipo de Documento</FieldLabel>
                  <Input
                    id="tipoDocumento"
                    value={tipoDocumento}
                    onChange={(event) => setTipoDocumento(event.target.value)}
                    placeholder="Ex: Laudo Médico"
                    disabled={isLoading}
                  />
                </Field>
              </FieldGroup>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={handleCancelarUpload}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!selectedFile || !tipoDocumento.trim() || isLoading}>
                  {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                  Anexar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {fetchError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Não foi possível carregar os documentos</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}

        {isFetching && documentos.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center gap-3 text-muted-foreground">
            <Spinner className="h-5 w-5" />
            <span>Carregando documentos...</span>
          </div>
        ) : documentos.length === 0 ? (
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentos.map((doc) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}