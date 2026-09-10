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
  role?: string;
  usuarioTemVinculos?: boolean;
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
  ABERTA = "aberta",
  EM_ANDAMENTO = "em_andamento",
  PRONTA_PARA_ANALISE = "pronta_para_analise",
  FINALIZADA = "finalizada",
  CANCELADA = "cancelada",
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

// Interfaces
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  perfil: PerfilUsuario;
  role?: string;
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

export type AreaUpdateInput =
  Partial<AreaCreateInput>;

export interface ApiFornecedorDTO {
  id: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  ativo?: boolean;
  fornecedorTemVinculos?: boolean;
}

export interface Fornecedor {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  fornecedorTemVinculos?: boolean;
}

export interface FornecedorCreateInput {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
}

export type FornecedorUpdateInput = Pick<
  FornecedorCreateInput,
  "nomeFantasia" | "telefone" | "email"
>;

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

// =========================
// COTAÇÕES
// =========================

export interface Cotacao {
  id: string;
  numero?: string;
  descricao: string;
  pacienteId: string;
  areaId: string;
  dataValidade: string;
  observacoes: string;

  /**
   * Status de processo da cotação.
   *
   * aberta:
   * Cotação criada, aguardando orçamentos.
   *
   * em_andamento:
   * Já possui pelo menos um orçamento.
   *
   * pronta_para_analise:
   * Quantidade suficiente de orçamentos para análise.
   *
   * finalizada:
   * Um fornecedor vencedor foi selecionado.
   *
   * cancelada:
   * Cotação cancelada com motivo obrigatório.
   */
  status: StatusCotacao;

  /**
   * Motivo informado quando a cotação é cancelada.
   */
  motivoCancelamento?: string | null;

  criadoEm: string;
  atualizadoEm?: string;

  pacienteNome?: string;
  areaNome?: string;

  itens: ItemCotacao[];
}

export interface ItemCotacao {
  id?: string;
  cotacaoId?: string;
  produtoId?: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  especificacoes?: string;
  ordem?: number;
}

export interface ItemCotacaoInput {
  produtoId?: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  especificacoes?: string;
  ordem?: number;
}

export interface CotacaoCreateInput {
  descricao: string;
  pacienteId: string;
  areaId: string;
  dataValidade: string;
  observacoes?: string;
  itens: ItemCotacaoInput[];
}

export interface CotacaoUpdateInput {
  descricao?: string;
  pacienteId?: string;
  areaId?: string;
  dataValidade?: string;
  observacoes?: string;
  itens?: (ItemCotacaoInput & {
    id?: string;
  })[];
}

export interface CotacaoStatusInput {
  status: StatusCotacao;
  motivo_cancelamento?: string;
}

// =========================
// ATENDIMENTOS
// =========================

export type TipoAtendimento =
  | "consulta"
  | "exame"
  | "procedimento"
  | "internacao"
  | "quimioterapia"
  | "radioterapia"
  | "outro";

export const TIPOS_ATENDIMENTO: TipoAtendimento[] = [
  "consulta",
  "exame",
  "procedimento",
  "internacao",
  "quimioterapia",
  "radioterapia",
  "outro",
];

export interface Atendimento {
  id: string;
  pacienteId: string;
  tipo: TipoAtendimento;
  dataAtendimento: string;
  descricao: string;
  criadoEm: string;
  atualizadoEm?: string;
  pacienteNome?: string;
  criadoPorNome?: string;
}

export interface HistoricoPaciente {
  id: string;
  pacienteId: string;
  tipoEvento: string;
  descricao: string;
  referenciaId?: string | null;
  criadoEm: string;
  usuarioNome?: string;
}

export interface AtendimentoCreateInput {
  pacienteId: string;
  tipo: TipoAtendimento;
  dataAtendimento: string;
  descricao: string;
}

export type AtendimentoUpdateInput =
  AtendimentoCreateInput;

export interface Documento {
  id: string;
  pacienteId: string;
  nomeArquivo: string;
  tipo: string;
  dataUpload: string;
  tamanho: string;
  url: string;
}

// =========================
// TYPES PARA FORMULÁRIOS
// =========================

export type PacienteFormData = Omit<
  Paciente,
  "id" | "criadoEm" | "atualizadoEm"
>;

export type CotacaoFormData = Omit<
  Cotacao,
  "id" | "criadoEm" | "atualizadoEm" | "status" | "itens"
> & {
  itens: Omit<ItemCotacao, "id">[];
};

export type AtendimentoFormData =
  AtendimentoCreateInput;

// =========================
// TYPES PARA FILTROS
// =========================

export interface FiltroPaciente {
  nome?: string;
  documento?: string;
  status?: StatusPaciente;
}

export interface FiltroCotacao {
  pacienteId?: string;
  areaId?: string;
  status?: StatusCotacao;
  busca?: string;
}

export interface FiltroAtendimento {
  pacienteId?: string;
  tipo?: TipoAtendimento;
  periodoInicio?: string;
  periodoFim?: string;
}

// =========================
// TYPES PARA DASHBOARD
// =========================

export interface DashboardStats {
  totalPacientes: number;
  pacientesAtivos: number;
  pacientesSuspensos: number;
  pacientesEncerrados: number;
}

