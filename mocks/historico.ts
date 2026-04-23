import { Historico, TipoEvento } from '@/types'

export const historicoMock: Historico[] = [
  // Paciente 001
  { id: 'hist-001', pacienteId: 'pac-001', dataHora: '2024-01-10T10:00:00', tipoEvento: TipoEvento.CADASTRO, descricao: 'Paciente cadastrado no sistema', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-002', pacienteId: 'pac-001', dataHora: '2024-01-15T14:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Acolhimento inicial realizado', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-003', pacienteId: 'pac-001', dataHora: '2024-01-20T08:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Transporte para primeira sessão de quimioterapia', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-004', pacienteId: 'pac-001', dataHora: '2024-03-01T10:00:00', tipoEvento: TipoEvento.COTACAO, descricao: 'Cotação de transporte criada', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-005', pacienteId: 'pac-001', dataHora: '2024-03-18T11:00:00', tipoEvento: TipoEvento.COTACAO, descricao: 'Cotação de medicamentos criada', usuarioResponsavel: 'Maria Silva' },
  
  // Paciente 002
  { id: 'hist-006', pacienteId: 'pac-002', dataHora: '2024-01-25T14:30:00', tipoEvento: TipoEvento.CADASTRO, descricao: 'Paciente cadastrado no sistema', usuarioResponsavel: 'João Santos' },
  { id: 'hist-007', pacienteId: 'pac-002', dataHora: '2024-02-01T09:00:00', tipoEvento: TipoEvento.ATUALIZACAO, descricao: 'Data de início de tratamento atualizada', usuarioResponsavel: 'João Santos' },
  { id: 'hist-008', pacienteId: 'pac-002', dataHora: '2024-02-10T14:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Sessão de apoio psicológico realizada', usuarioResponsavel: 'Ana Oliveira' },
  { id: 'hist-009', pacienteId: 'pac-002', dataHora: '2024-02-15T14:00:00', tipoEvento: TipoEvento.COTACAO, descricao: 'Cotação de medicamentos criada', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-010', pacienteId: 'pac-002', dataHora: '2024-02-20T10:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Entrega de medicamentos realizada', usuarioResponsavel: 'Maria Silva' },
  
  // Paciente 003
  { id: 'hist-011', pacienteId: 'pac-003', dataHora: '2023-08-10T11:00:00', tipoEvento: TipoEvento.CADASTRO, descricao: 'Paciente cadastrado no sistema', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-012', pacienteId: 'pac-003', dataHora: '2024-02-15T07:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Transporte para consulta de retorno', usuarioResponsavel: 'João Santos' },
  { id: 'hist-013', pacienteId: 'pac-003', dataHora: '2024-03-01T09:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Entrega de cesta básica mensal', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-014', pacienteId: 'pac-003', dataHora: '2024-03-10T09:00:00', tipoEvento: TipoEvento.COTACAO, descricao: 'Cotação de alimentação criada', usuarioResponsavel: 'João Santos' },
  
  // Paciente 004
  { id: 'hist-015', pacienteId: 'pac-004', dataHora: '2024-02-25T09:30:00', tipoEvento: TipoEvento.CADASTRO, descricao: 'Paciente cadastrado no sistema', usuarioResponsavel: 'João Santos' },
  { id: 'hist-016', pacienteId: 'pac-004', dataHora: '2024-03-05T11:00:00', tipoEvento: TipoEvento.COTACAO, descricao: 'Cotação de exames pré-operatórios criada', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-017', pacienteId: 'pac-004', dataHora: '2024-03-08T08:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Tomografia pré-operatória realizada', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-018', pacienteId: 'pac-004', dataHora: '2024-03-12T10:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Orientações pré-operatórias', usuarioResponsavel: 'Ana Oliveira' },
  
  // Paciente 005
  { id: 'hist-019', pacienteId: 'pac-005', dataHora: '2023-11-15T08:00:00', tipoEvento: TipoEvento.CADASTRO, descricao: 'Paciente cadastrado no sistema', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-020', pacienteId: 'pac-005', dataHora: '2024-01-25T11:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Entrega de medicamentos quimioterápicos', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-021', pacienteId: 'pac-005', dataHora: '2024-02-20T14:00:00', tipoEvento: TipoEvento.STATUS, descricao: 'Status alterado para Suspenso - Aguardando retorno médico', usuarioResponsavel: 'João Santos' },
  
  // Paciente 006
  { id: 'hist-022', pacienteId: 'pac-006', dataHora: '2023-05-25T10:30:00', tipoEvento: TipoEvento.CADASTRO, descricao: 'Paciente cadastrado no sistema', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-023', pacienteId: 'pac-006', dataHora: '2023-12-20T15:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Visita domiciliar para acompanhamento final', usuarioResponsavel: 'Ana Oliveira' },
  { id: 'hist-024', pacienteId: 'pac-006', dataHora: '2024-01-10T11:00:00', tipoEvento: TipoEvento.STATUS, descricao: 'Status alterado para Encerrado - Tratamento concluído', usuarioResponsavel: 'João Santos' },
  
  // Paciente 007
  { id: 'hist-025', pacienteId: 'pac-007', dataHora: '2024-01-05T13:00:00', tipoEvento: TipoEvento.CADASTRO, descricao: 'Paciente cadastrado no sistema', usuarioResponsavel: 'João Santos' },
  { id: 'hist-026', pacienteId: 'pac-007', dataHora: '2024-01-10T08:00:00', tipoEvento: TipoEvento.COTACAO, descricao: 'Cotação de transporte para cirurgia criada', usuarioResponsavel: 'João Santos' },
  { id: 'hist-027', pacienteId: 'pac-007', dataHora: '2024-01-12T05:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Transporte para cirurgia em Campo Grande', usuarioResponsavel: 'João Santos' },
  
  // Paciente 008
  { id: 'hist-028', pacienteId: 'pac-008', dataHora: '2024-02-10T15:00:00', tipoEvento: TipoEvento.CADASTRO, descricao: 'Paciente cadastrado no sistema', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-029', pacienteId: 'pac-008', dataHora: '2024-03-01T10:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Acolhimento inicial e orientações', usuarioResponsavel: 'Ana Oliveira' },
  { id: 'hist-030', pacienteId: 'pac-008', dataHora: '2024-03-12T15:00:00', tipoEvento: TipoEvento.COTACAO, descricao: 'Cotação de medicamentos para imunoterapia', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-031', pacienteId: 'pac-008', dataHora: '2024-03-15T11:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Entrega de medicamentos para imunoterapia', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-032', pacienteId: 'pac-008', dataHora: '2024-03-15T11:30:00', tipoEvento: TipoEvento.DOCUMENTO, descricao: 'Laudo médico anexado', usuarioResponsavel: 'Maria Silva' },
  
  // Paciente 009
  { id: 'hist-033', pacienteId: 'pac-009', dataHora: '2023-09-05T09:00:00', tipoEvento: TipoEvento.CADASTRO, descricao: 'Paciente cadastrado no sistema', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-034', pacienteId: 'pac-009', dataHora: '2024-02-20T06:30:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Transporte para sessão de radioterapia', usuarioResponsavel: 'João Santos' },
  { id: 'hist-035', pacienteId: 'pac-009', dataHora: '2024-03-08T10:30:00', tipoEvento: TipoEvento.COTACAO, descricao: 'Cotação de exames de acompanhamento', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-036', pacienteId: 'pac-009', dataHora: '2024-03-10T09:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Hemograma de acompanhamento realizado', usuarioResponsavel: 'Maria Silva' },
  
  // Paciente 010
  { id: 'hist-037', pacienteId: 'pac-010', dataHora: '2024-03-01T11:00:00', tipoEvento: TipoEvento.CADASTRO, descricao: 'Paciente cadastrado no sistema', usuarioResponsavel: 'João Santos' },
  { id: 'hist-038', pacienteId: 'pac-010', dataHora: '2024-03-06T14:00:00', tipoEvento: TipoEvento.COTACAO, descricao: 'Cotação de exames pós-cirúrgicos', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-039', pacienteId: 'pac-010', dataHora: '2024-03-07T06:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Transporte para cirurgia de tireoide', usuarioResponsavel: 'João Santos' },
  
  // Paciente 011
  { id: 'hist-040', pacienteId: 'pac-011', dataHora: '2023-03-25T10:00:00', tipoEvento: TipoEvento.CADASTRO, descricao: 'Paciente cadastrado no sistema', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-041', pacienteId: 'pac-011', dataHora: '2023-10-15T16:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Acompanhamento de cuidados paliativos', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-042', pacienteId: 'pac-011', dataHora: '2023-12-15T16:00:00', tipoEvento: TipoEvento.STATUS, descricao: 'Status alterado para Encerrado - Falecimento', usuarioResponsavel: 'João Santos' },
  
  // Paciente 012
  { id: 'hist-043', pacienteId: 'pac-012', dataHora: '2024-01-15T08:30:00', tipoEvento: TipoEvento.CADASTRO, descricao: 'Paciente cadastrado no sistema', usuarioResponsavel: 'João Santos' },
  { id: 'hist-044', pacienteId: 'pac-012', dataHora: '2024-02-01T07:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Transporte para início de tratamento', usuarioResponsavel: 'Maria Silva' },
  { id: 'hist-045', pacienteId: 'pac-012', dataHora: '2024-03-15T09:00:00', tipoEvento: TipoEvento.COTACAO, descricao: 'Cotação de alimentação durante internação', usuarioResponsavel: 'João Santos' },
  { id: 'hist-046', pacienteId: 'pac-012', dataHora: '2024-03-15T12:00:00', tipoEvento: TipoEvento.ATENDIMENTO, descricao: 'Fornecimento de alimentação durante internação', usuarioResponsavel: 'João Santos' }
]
