import { Documento } from '@/types'

export const documentosMock: Documento[] = [
  {
    id: 'doc-001',
    pacienteId: 'pac-001',
    nomeArquivo: 'laudo_oncologico_001.pdf',
    tipo: 'Laudo Médico',
    dataUpload: '2024-01-10',
    tamanho: '245 KB'
  },
  {
    id: 'doc-002',
    pacienteId: 'pac-001',
    nomeArquivo: 'exame_psa_janeiro.pdf',
    tipo: 'Exame',
    dataUpload: '2024-01-15',
    tamanho: '128 KB'
  },
  {
    id: 'doc-003',
    pacienteId: 'pac-002',
    nomeArquivo: 'mamografia_2024.pdf',
    tipo: 'Exame',
    dataUpload: '2024-02-01',
    tamanho: '1.2 MB'
  },
  {
    id: 'doc-004',
    pacienteId: 'pac-003',
    nomeArquivo: 'tomografia_torax.pdf',
    tipo: 'Exame',
    dataUpload: '2023-08-20',
    tamanho: '3.5 MB'
  },
  {
    id: 'doc-005',
    pacienteId: 'pac-004',
    nomeArquivo: 'biopsia_resultado.pdf',
    tipo: 'Laudo Médico',
    dataUpload: '2024-02-28',
    tamanho: '512 KB'
  },
  {
    id: 'doc-006',
    pacienteId: 'pac-008',
    nomeArquivo: 'laudo_melanoma.pdf',
    tipo: 'Laudo Médico',
    dataUpload: '2024-03-15',
    tamanho: '320 KB'
  }
]
