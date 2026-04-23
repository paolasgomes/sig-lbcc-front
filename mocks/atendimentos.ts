import { Atendimento } from '@/types'

export const atendimentosMock: Atendimento[] = [
  {
    id: 'atend-001',
    pacienteId: 'pac-001',
    data: '2024-01-20',
    areaAtendimentoId: 'area-001',
    tipoAtendimento: 'Transporte',
    descricao: 'Transporte para primeira sessão de quimioterapia em Campo Grande',
    cotacaoId: 'cot-001',
    criadoPor: 'usr-001',
    criadoEm: '2024-01-20T08:00:00'
  },
  {
    id: 'atend-002',
    pacienteId: 'pac-001',
    data: '2024-02-05',
    areaAtendimentoId: 'area-001',
    tipoAtendimento: 'Transporte',
    descricao: 'Transporte para segunda sessão de quimioterapia',
    cotacaoId: 'cot-001',
    criadoPor: 'usr-001',
    criadoEm: '2024-02-05T07:30:00'
  },
  {
    id: 'atend-003',
    pacienteId: 'pac-002',
    data: '2024-02-10',
    areaAtendimentoId: 'area-005',
    tipoAtendimento: 'Apoio psicológico',
    descricao: 'Sessão de apoio psicológico para paciente e família',
    criadoPor: 'usr-003',
    criadoEm: '2024-02-10T14:00:00'
  },
  {
    id: 'atend-004',
    pacienteId: 'pac-002',
    data: '2024-02-20',
    areaAtendimentoId: 'area-003',
    tipoAtendimento: 'Entrega de medicamento',
    descricao: 'Entrega de medicamentos para controle de náusea',
    cotacaoId: 'cot-002',
    criadoPor: 'usr-001',
    criadoEm: '2024-02-20T10:00:00'
  },
  {
    id: 'atend-005',
    pacienteId: 'pac-003',
    data: '2024-03-01',
    areaAtendimentoId: 'area-002',
    tipoAtendimento: 'Entrega de cesta',
    descricao: 'Entrega de cesta básica mensal',
    cotacaoId: 'cot-003',
    criadoPor: 'usr-001',
    criadoEm: '2024-03-01T09:00:00'
  },
  {
    id: 'atend-006',
    pacienteId: 'pac-003',
    data: '2024-02-15',
    areaAtendimentoId: 'area-001',
    tipoAtendimento: 'Transporte',
    descricao: 'Transporte para consulta de retorno',
    criadoPor: 'usr-002',
    criadoEm: '2024-02-15T07:00:00'
  },
  {
    id: 'atend-007',
    pacienteId: 'pac-004',
    data: '2024-03-08',
    areaAtendimentoId: 'area-004',
    tipoAtendimento: 'Exame',
    descricao: 'Realização de tomografia pré-operatória',
    cotacaoId: 'cot-004',
    criadoPor: 'usr-001',
    criadoEm: '2024-03-08T08:00:00'
  },
  {
    id: 'atend-008',
    pacienteId: 'pac-005',
    data: '2024-01-25',
    areaAtendimentoId: 'area-003',
    tipoAtendimento: 'Entrega de medicamento',
    descricao: 'Entrega de medicamentos quimioterápicos',
    criadoPor: 'usr-001',
    criadoEm: '2024-01-25T11:00:00'
  },
  {
    id: 'atend-009',
    pacienteId: 'pac-007',
    data: '2024-01-12',
    areaAtendimentoId: 'area-001',
    tipoAtendimento: 'Transporte',
    descricao: 'Transporte para cirurgia em Campo Grande',
    cotacaoId: 'cot-005',
    criadoPor: 'usr-002',
    criadoEm: '2024-01-12T05:00:00'
  },
  {
    id: 'atend-010',
    pacienteId: 'pac-008',
    data: '2024-03-01',
    areaAtendimentoId: 'area-005',
    tipoAtendimento: 'Acolhimento',
    descricao: 'Acolhimento inicial e orientações sobre tratamento',
    criadoPor: 'usr-003',
    criadoEm: '2024-03-01T10:00:00'
  },
  {
    id: 'atend-011',
    pacienteId: 'pac-009',
    data: '2024-03-10',
    areaAtendimentoId: 'area-004',
    tipoAtendimento: 'Exame',
    descricao: 'Realização de hemograma de acompanhamento',
    cotacaoId: 'cot-007',
    criadoPor: 'usr-001',
    criadoEm: '2024-03-10T09:00:00'
  },
  {
    id: 'atend-012',
    pacienteId: 'pac-010',
    data: '2024-03-07',
    areaAtendimentoId: 'area-001',
    tipoAtendimento: 'Transporte',
    descricao: 'Transporte para cirurgia de tireoide',
    criadoPor: 'usr-002',
    criadoEm: '2024-03-07T06:00:00'
  },
  {
    id: 'atend-013',
    pacienteId: 'pac-012',
    data: '2024-02-01',
    areaAtendimentoId: 'area-001',
    tipoAtendimento: 'Transporte',
    descricao: 'Transporte para início de tratamento',
    criadoPor: 'usr-001',
    criadoEm: '2024-02-01T07:00:00'
  },
  {
    id: 'atend-014',
    pacienteId: 'pac-012',
    data: '2024-03-15',
    areaAtendimentoId: 'area-002',
    tipoAtendimento: 'Alimentação',
    descricao: 'Fornecimento de alimentação durante internação',
    cotacaoId: 'cot-008',
    criadoPor: 'usr-002',
    criadoEm: '2024-03-15T12:00:00'
  },
  {
    id: 'atend-015',
    pacienteId: 'pac-001',
    data: '2024-03-18',
    areaAtendimentoId: 'area-003',
    tipoAtendimento: 'Entrega de medicamento',
    descricao: 'Entrega de medicamentos de uso contínuo',
    cotacaoId: 'cot-010',
    criadoPor: 'usr-001',
    criadoEm: '2024-03-18T14:00:00'
  },
  {
    id: 'atend-016',
    pacienteId: 'pac-006',
    data: '2023-12-20',
    areaAtendimentoId: 'area-005',
    tipoAtendimento: 'Visita domiciliar',
    descricao: 'Visita domiciliar para acompanhamento final',
    criadoPor: 'usr-003',
    criadoEm: '2023-12-20T15:00:00'
  },
  {
    id: 'atend-017',
    pacienteId: 'pac-011',
    data: '2023-10-15',
    areaAtendimentoId: 'area-005',
    tipoAtendimento: 'Cuidados paliativos',
    descricao: 'Acompanhamento de cuidados paliativos',
    criadoPor: 'usr-001',
    criadoEm: '2023-10-15T16:00:00'
  },
  {
    id: 'atend-018',
    pacienteId: 'pac-004',
    data: '2024-03-12',
    areaAtendimentoId: 'area-005',
    tipoAtendimento: 'Orientação',
    descricao: 'Orientações pré-operatórias para paciente e acompanhante',
    criadoPor: 'usr-003',
    criadoEm: '2024-03-12T10:00:00'
  },
  {
    id: 'atend-019',
    pacienteId: 'pac-009',
    data: '2024-02-20',
    areaAtendimentoId: 'area-001',
    tipoAtendimento: 'Transporte',
    descricao: 'Transporte para sessão de radioterapia',
    criadoPor: 'usr-002',
    criadoEm: '2024-02-20T06:30:00'
  },
  {
    id: 'atend-020',
    pacienteId: 'pac-008',
    data: '2024-03-15',
    areaAtendimentoId: 'area-003',
    tipoAtendimento: 'Entrega de medicamento',
    descricao: 'Entrega de medicamentos para imunoterapia',
    cotacaoId: 'cot-006',
    criadoPor: 'usr-001',
    criadoEm: '2024-03-15T11:00:00'
  }
]
