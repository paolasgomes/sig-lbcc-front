import { Usuario, PerfilUsuario } from '@/types'

export const usuariosMock: Usuario[] = [
  {
    id: 'usr-001',
    nome: 'Maria Silva',
    email: 'operador@lbcc.org.br',
    senha: '123456',
    perfil: PerfilUsuario.OPERADOR,
    ativo: true
  },
  {
    id: 'usr-002',
    nome: 'João Santos',
    email: 'gestor@lbcc.org.br',
    senha: '123456',
    perfil: PerfilUsuario.GESTOR,
    ativo: true
  },
  {
    id: 'usr-003',
    nome: 'Ana Oliveira',
    email: 'prefeitura@bataguassu.gov.br',
    senha: '123456',
    perfil: PerfilUsuario.PREFEITURA,
    ativo: true
  }
]
