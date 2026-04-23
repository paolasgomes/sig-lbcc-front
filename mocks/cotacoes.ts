import { Cotacao, StatusCotacao } from '@/types'

export const cotacoesMock: Cotacao[] = [
  {
    id: 'cot-001',
    pacienteId: 'pac-001',
    areaAtendimentoId: 'area-001',
    fornecedorId: 'forn-001',
    dataSolicitacao: '2024-03-01',
    dataValidade: '2024-04-01',
    observacoes: 'Transporte para quimioterapia em Campo Grande',
    status: StatusCotacao.VALIDA,
    itens: [
      { id: 'item-001', descricao: 'Transporte ida/volta - Campo Grande', unidade: 'viagem', quantidade: 4, valorUnitario: 350.00 }
    ],
    criadoPor: 'usr-001',
    criadoEm: '2024-03-01T10:00:00'
  },
  {
    id: 'cot-002',
    pacienteId: 'pac-002',
    areaAtendimentoId: 'area-003',
    fornecedorId: 'forn-003',
    dataSolicitacao: '2024-02-15',
    dataValidade: '2024-03-15',
    observacoes: 'Medicamentos para tratamento de náusea',
    status: StatusCotacao.EXPIRADA,
    itens: [
      { id: 'item-002', descricao: 'Ondansetrona 8mg', unidade: 'caixa', quantidade: 3, valorUnitario: 85.00 },
      { id: 'item-003', descricao: 'Tramadol 50mg', unidade: 'caixa', quantidade: 2, valorUnitario: 45.00 }
    ],
    criadoPor: 'usr-001',
    criadoEm: '2024-02-15T14:00:00'
  },
  {
    id: 'cot-003',
    pacienteId: 'pac-003',
    areaAtendimentoId: 'area-002',
    fornecedorId: 'forn-002',
    dataSolicitacao: '2024-03-10',
    dataValidade: '2024-04-10',
    observacoes: 'Cesta básica mensal',
    status: StatusCotacao.VALIDA,
    itens: [
      { id: 'item-004', descricao: 'Cesta básica completa', unidade: 'unidade', quantidade: 1, valorUnitario: 180.00 },
      { id: 'item-005', descricao: 'Suplemento nutricional', unidade: 'lata', quantidade: 2, valorUnitario: 95.00 }
    ],
    criadoPor: 'usr-002',
    criadoEm: '2024-03-10T09:00:00'
  },
  {
    id: 'cot-004',
    pacienteId: 'pac-004',
    areaAtendimentoId: 'area-004',
    fornecedorId: 'forn-006',
    dataSolicitacao: '2024-03-05',
    dataValidade: '2024-04-05',
    observacoes: 'Exames pré-operatórios',
    status: StatusCotacao.VALIDA,
    itens: [
      { id: 'item-006', descricao: 'Tomografia computadorizada', unidade: 'exame', quantidade: 1, valorUnitario: 450.00 },
      { id: 'item-007', descricao: 'Hemograma completo', unidade: 'exame', quantidade: 1, valorUnitario: 35.00 }
    ],
    criadoPor: 'usr-001',
    criadoEm: '2024-03-05T11:00:00'
  },
  {
    id: 'cot-005',
    pacienteId: 'pac-007',
    areaAtendimentoId: 'area-001',
    fornecedorId: 'forn-001',
    dataSolicitacao: '2024-01-10',
    dataValidade: '2024-02-10',
    observacoes: 'Transporte para cirurgia',
    status: StatusCotacao.EXPIRADA,
    itens: [
      { id: 'item-008', descricao: 'Transporte ida/volta - Campo Grande', unidade: 'viagem', quantidade: 2, valorUnitario: 350.00 }
    ],
    criadoPor: 'usr-002',
    criadoEm: '2024-01-10T08:00:00'
  },
  {
    id: 'cot-006',
    pacienteId: 'pac-008',
    areaAtendimentoId: 'area-003',
    fornecedorId: 'forn-005',
    dataSolicitacao: '2024-03-12',
    dataValidade: '2024-04-12',
    observacoes: 'Medicamentos para imunoterapia',
    status: StatusCotacao.PENDENTE,
    itens: [
      { id: 'item-009', descricao: 'Morfina 10mg', unidade: 'caixa', quantidade: 2, valorUnitario: 120.00 },
      { id: 'item-010', descricao: 'Ondansetrona 8mg', unidade: 'caixa', quantidade: 2, valorUnitario: 85.00 }
    ],
    criadoPor: 'usr-001',
    criadoEm: '2024-03-12T15:00:00'
  },
  {
    id: 'cot-007',
    pacienteId: 'pac-009',
    areaAtendimentoId: 'area-004',
    fornecedorId: 'forn-004',
    dataSolicitacao: '2024-03-08',
    dataValidade: '2024-04-08',
    observacoes: 'Exames de acompanhamento',
    status: StatusCotacao.VALIDA,
    itens: [
      { id: 'item-011', descricao: 'Hemograma completo', unidade: 'exame', quantidade: 1, valorUnitario: 35.00 },
      { id: 'item-012', descricao: 'Ultrassonografia abdominal', unidade: 'exame', quantidade: 1, valorUnitario: 180.00 }
    ],
    criadoPor: 'usr-001',
    criadoEm: '2024-03-08T10:30:00'
  },
  {
    id: 'cot-008',
    pacienteId: 'pac-012',
    areaAtendimentoId: 'area-002',
    fornecedorId: 'forn-002',
    dataSolicitacao: '2024-03-15',
    dataValidade: '2024-04-15',
    observacoes: 'Alimentação durante internação',
    status: StatusCotacao.PENDENTE,
    itens: [
      { id: 'item-013', descricao: 'Kit alimentação hospitalar', unidade: 'kit', quantidade: 10, valorUnitario: 45.00 }
    ],
    criadoPor: 'usr-002',
    criadoEm: '2024-03-15T09:00:00'
  },
  {
    id: 'cot-009',
    pacienteId: 'pac-010',
    areaAtendimentoId: 'area-004',
    fornecedorId: 'forn-006',
    dataSolicitacao: '2024-03-06',
    dataValidade: '2024-04-06',
    observacoes: 'Exames pós-cirúrgicos',
    status: StatusCotacao.VALIDA,
    itens: [
      { id: 'item-014', descricao: 'Ressonância magnética', unidade: 'exame', quantidade: 1, valorUnitario: 850.00 }
    ],
    criadoPor: 'usr-001',
    criadoEm: '2024-03-06T14:00:00'
  },
  {
    id: 'cot-010',
    pacienteId: 'pac-001',
    areaAtendimentoId: 'area-003',
    fornecedorId: 'forn-003',
    dataSolicitacao: '2024-03-18',
    dataValidade: '2024-04-18',
    observacoes: 'Medicamentos de uso contínuo',
    status: StatusCotacao.PENDENTE,
    itens: [
      { id: 'item-015', descricao: 'Tramadol 50mg', unidade: 'caixa', quantidade: 3, valorUnitario: 45.00 },
      { id: 'item-016', descricao: 'Ondansetrona 8mg', unidade: 'caixa', quantidade: 2, valorUnitario: 85.00 }
    ],
    criadoPor: 'usr-001',
    criadoEm: '2024-03-18T11:00:00'
  }
]
