// Enums
export enum PerfilUsuario {
  OPERADOR = "operador",
  GESTOR = "gestor",
  PREFEITURA = "prefeitura",
}

export interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsuarioCreateInput {
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo?: boolean;
  senha: string;
}

export interface UsuarioUpdateInput {
  nome?: string;
  email?: string;
  perfil?: PerfilUsuario;
  ativo?: boolean;
  senha?: string;
}

export enum StatusPaciente {
  ATIVO = "ativo",
  SUSPENSO = "suspenso",
  ENCERRADO = "encerrado",
}

export enum StatusCotacao {
  RASCUNHO = "rascunho",
  ENVIADA = "enviada",
  EM_ANALISE = "em_analise",
  APROVADA = "aprovada",
  REPROVADA = "reprovada",
  PENDENTE = "pendente",
  VALIDA = "valida",
  EXPIRADA = "expirada",
}

export enum Sexo {
  MASCULINO = "masculino",
  FEMININO = "feminino",
  OUTRO = "outro",
}

export enum EstadoCivil {
  SOLTEIRO = "solteiro",
  CASADO = "casado",
  DIVORCIADO = "divorciado",
  VIUVO = "viuvo",
  UNIAO_ESTAVEL = "uniao_estavel",
}

export enum TipoEvento {
  CADASTRO = "cadastro",
  ATUALIZACAO = "atualizacao",
  ATENDIMENTO = "atendimento",
  COTACAO = "cotacao",
  STATUS = "status",
  DOCUMENTO = "documento",
}

// Interfaces
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  perfil: PerfilUsuario;
  ativo: boolean;
}

export interface Paciente {
  id: string;
  nome?: string;
  nomeCompleto: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  sexo: Sexo;
  estadoCivil: EstadoCivil;
  /** @deprecated - Not persisted in API, kept for backward compatibility */
  naturalidade?: string;
  /** @deprecated - Not persisted in API, kept for backward compatibility */
  escolaridade?: string;
  profissao: string;
  endereco: Endereco;
  telefone: string;
  /** @deprecated - Not persisted in API, kept for backward compatibility */
  nomePai?: string;
  /** @deprecated - Not persisted in API, kept for backward compatibility */
  nomeMae?: string;
  numeroSUS: string;
  diagnosticoOncologico: string;
  diagnostico?: string;
  setor: string;
  areaTratamento: string;
  dataInicioTratamento: string;
  medicoResponsavel: string;
  status: StatusPaciente;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface AreaAtendimento {
  id: string;
  nome: string;
  descricao: string;
  ativa: boolean;
}

export interface ApiAreaDTO {
  id: string;
  nome: string;
  descricao: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface AreaCreateInput {
  nome: string;
  descricao: string;
}

export type AreaUpdateInput = Partial<AreaCreateInput>;

export interface Fornecedor {
  id: string;
  nome: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  tipoServico: string;
  contato: string;
  telefoneContato?: string;
  email: string;
  telefone: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  ativo: boolean;
}

export interface ApiProdutoDTO {
  id: string;
  nome: string;
  descricao: string;
  unidade: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  unidade: string;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
  unidadeMedida?: string;
  precoReferencia?: number;
  referenciaPreco?: number;
  fornecedorId?: string;
}

export interface ProdutoCreateInput {
  nome: string;
  descricao: string;
  unidade: string;
  ativo?: boolean;
}

export type ProdutoUpdateInput = Partial<ProdutoCreateInput>;

export interface Cotacao {
  id: string;
  pacienteId: string;
  areaAtendimentoId: string;
  fornecedorId: string;
  dataSolicitacao: string;
  dataCriacao?: string;
  dataAprovacao?: string;
  aprovadoPor?: string;
  dataValidade: string;
  observacoes: string;
  status:
    | StatusCotacao
    | "rascunho"
    | "enviada"
    | "em_analise"
    | "aprovada"
    | "reprovada";
  valorTotal?: number;
  itens: ItemCotacao[];
  criadoPor: string;
  criadoEm: string;
}

export interface ItemCotacao {
  id: string;
  produtoId?: string;
  fornecedorId?: string;
  observacao?: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario?: number;
  valorUnitario: number;
}

export interface Atendimento {
  id: string;
  pacienteId: string;
  data: string;
  dataHora?: string;
  areaAtendimentoId: string;
  areaId?: string;
  tipoAtendimento: string;
  tipo?: string;
  descricao: string;
  observacoes?: string;
  status?: string;
  responsavelId?: string;
  cotacaoId?: string;
  criadoPor: string;
  criadoEm: string;
}

export interface Historico {
  id: string;
  pacienteId: string;
  dataHora: string;
  tipoEvento: TipoEvento;
  descricao: string;
  usuarioResponsavel: string;
}

export interface Documento {
  id: string;
  pacienteId: string;
  nomeArquivo: string;
  tipo: string;
  dataUpload: string;
  tamanho: string;
  url: string;
}

// Types para formulários
export type PacienteFormData = Omit<Paciente, "id" | "criadoEm" | "atualizadoEm">;
export type CotacaoFormData = Omit<Cotacao, "id" | "criadoEm">;
export type AtendimentoFormData = Omit<Atendimento, "id" | "criadoEm">;

// Types para filtros
export interface FiltroPaciente {
  nome?: string;
  documento?: string;
  status?: StatusPaciente;
}

export interface FiltroCotacao {
  pacienteId?: string;
  areaId?: string;
  periodoInicio?: string;
  periodoFim?: string;
  status?: StatusCotacao;
}

export interface FiltroAtendimento {
  pacienteId?: string;
  areaId?: string;
  periodoInicio?: string;
  periodoFim?: string;
  tipo?: string;
}

// Types para dashboard
export interface DashboardStats {
  totalPacientes: number;
  totalAtendimentos: number;
  totalCotacoes: number;
  cotacoesVencidas: number;
  pacientesAtivos: number;
  pacientesSuspensos: number;
  pacientesEncerrados: number;
}
