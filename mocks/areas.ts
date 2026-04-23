import { AreaAtendimento } from '@/types'

export const areasMock: AreaAtendimento[] = [
  {
    id: 'area-001',
    nome: 'Transporte',
    descricao: 'Transporte de pacientes para consultas e tratamentos',
    ativa: true
  },
  {
    id: 'area-002',
    nome: 'Alimentação',
    descricao: 'Fornecimento de cestas básicas e alimentação durante tratamento',
    ativa: true
  },
  {
    id: 'area-003',
    nome: 'Medicamentos',
    descricao: 'Fornecimento de medicamentos não disponíveis no SUS',
    ativa: true
  },
  {
    id: 'area-004',
    nome: 'Exames',
    descricao: 'Realização de exames complementares',
    ativa: true
  },
  {
    id: 'area-005',
    nome: 'Apoio Social',
    descricao: 'Assistência social e apoio psicológico',
    ativa: true
  }
]
