import { Fornecedor } from '@/types'

export const fornecedoresMock: Fornecedor[] = [
  {
    id: 'forn-001',
    nome: 'TransBata Transportes',
    tipoServico: 'Transporte',
    contato: 'Carlos Ferreira',
    email: 'contato@transbata.com.br',
    telefone: '(67) 3541-1234',
    ativo: true
  },
  {
    id: 'forn-002',
    nome: 'Supermercado Bom Preço',
    tipoServico: 'Alimentação',
    contato: 'José Lima',
    email: 'compras@bompreco.com.br',
    telefone: '(67) 3541-2345',
    ativo: true
  },
  {
    id: 'forn-003',
    nome: 'Farmácia Central',
    tipoServico: 'Medicamentos',
    contato: 'Lucia Mendes',
    email: 'vendas@farmaciacentral.com.br',
    telefone: '(67) 3541-3456',
    ativo: true
  },
  {
    id: 'forn-004',
    nome: 'Laboratório Diagnóstico',
    tipoServico: 'Exames',
    contato: 'Dr. Pedro Alves',
    email: 'agendamento@labdiagnostico.com.br',
    telefone: '(67) 3541-4567',
    ativo: true
  },
  {
    id: 'forn-005',
    nome: 'Drogaria Saúde',
    tipoServico: 'Medicamentos',
    contato: 'Marina Costa',
    email: 'atendimento@drogariasaude.com.br',
    telefone: '(67) 3541-5678',
    ativo: true
  },
  {
    id: 'forn-006',
    nome: 'Clínica Imagem',
    tipoServico: 'Exames',
    contato: 'Dra. Carla Souza',
    email: 'recepcao@clinicaimagem.com.br',
    telefone: '(67) 3541-6789',
    ativo: true
  }
]
