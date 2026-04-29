"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  UsuarioDTO,
  UsuarioCreateInput,
  UsuarioUpdateInput,
  Paciente,
  AreaAtendimento,
  Fornecedor,
  Produto,
  Cotacao,
  Atendimento,
  Historico,
  Documento,
  StatusPaciente,
  StatusCotacao,
  TipoEvento,
  DashboardStats,
  Sexo,
  EstadoCivil,
} from "@/types";
import {
  areasMock,
  fornecedoresMock,
  produtosMock,
  cotacoesMock,
  atendimentosMock,
  historicoMock,
  documentosMock,
} from "@/mocks";
import { useAuth } from "@/contexts/auth-context";
import {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  excluirUsuario,
} from "@/services/usuarios-service";
import {
  ApiPacienteDTO,
  PacienteCreateInput,
  PacienteUpdateInput,
  listarPacientes,
  obterPaciente,
  criarPaciente,
  atualizarPaciente,
  inativarPaciente,
} from "@/services/pacientes-service";
import {
  ApiProdutoDTO,
  ProdutoCreateInput,
  ProdutoUpdateInput,
  mapApiProdutoToProduto,
  mapProdutoToApiPayload,
  listarProdutos,
  obterProduto,
  criarProduto,
  atualizarProduto,
  desativarProduto as desativarProdutoApi,
} from "@/services/produtos-service";

function formatApiDate(date?: string | null) {
  return date ?? "";
}

function mapApiSexoToSexo(sexo?: string | null): Sexo {
  if (!sexo) {
    return Sexo.OUTRO;
  }

  const normalized = sexo.trim().toUpperCase();

  if (normalized === "M" || normalized === "MASCULINO") {
    return Sexo.MASCULINO;
  }

  if (normalized === "F" || normalized === "FEMININO") {
    return Sexo.FEMININO;
  }

  return Sexo.OUTRO;
}

function mapSexoToApiSexo(sexo?: Sexo) {
  if (sexo === Sexo.MASCULINO) {
    return "M";
  }

  if (sexo === Sexo.FEMININO) {
    return "F";
  }

  return "O";
}

function mapApiEstadoCivilToEstadoCivil(estadoCivil?: string | null): EstadoCivil {
  if (!estadoCivil) {
    return EstadoCivil.SOLTEIRO;
  }

  const normalized = estadoCivil.trim().toLowerCase();

  if (normalized.includes("casad")) {
    return EstadoCivil.CASADO;
  }

  if (normalized.includes("divorc")) {
    return EstadoCivil.DIVORCIADO;
  }

  if (normalized.includes("viuv")) {
    return EstadoCivil.VIUVO;
  }

  if (normalized.includes("uniao") || normalized.includes("união")) {
    return EstadoCivil.UNIAO_ESTAVEL;
  }

  return EstadoCivil.SOLTEIRO;
}

function mapEstadoCivilToApiEstadoCivil(estadoCivil?: EstadoCivil) {
  if (estadoCivil === EstadoCivil.CASADO) {
    return "Casado";
  }

  if (estadoCivil === EstadoCivil.DIVORCIADO) {
    return "Divorciado";
  }

  if (estadoCivil === EstadoCivil.VIUVO) {
    return "Viuvo";
  }

  if (estadoCivil === EstadoCivil.UNIAO_ESTAVEL) {
    return "Uniao Estavel";
  }

  return "Solteiro";
}

function mapApiStatusToStatusPaciente(status?: string | null): StatusPaciente {
  if (!status) {
    return StatusPaciente.ATIVO;
  }

  const normalized = status.trim().toLowerCase();

  if (normalized === "suspenso") {
    return StatusPaciente.SUSPENSO;
  }

  if (normalized === "encerrado" || normalized === "inativo") {
    return StatusPaciente.ENCERRADO;
  }

  return StatusPaciente.ATIVO;
}

function mapStatusPacienteToApiStatus(status?: StatusPaciente) {
  if (status === StatusPaciente.SUSPENSO) {
    return "suspenso";
  }

  if (status === StatusPaciente.ENCERRADO) {
    return "inativo";
  }

  return "ativo";
}

function mapApiPacienteToPaciente(apiPaciente: ApiPacienteDTO): Paciente {
  return {
    id: apiPaciente.id,
    nome: apiPaciente.nome,
    nomeCompleto: apiPaciente.nome,
    cpf: apiPaciente.cpf,
    rg: apiPaciente.rg ?? "",
    dataNascimento: formatApiDate(apiPaciente.data_nascimento),
    sexo: mapApiSexoToSexo(apiPaciente.sexo),
    estadoCivil: mapApiEstadoCivilToEstadoCivil(apiPaciente.estado_civil),
    naturalidade: "",
    escolaridade: "",
    profissao: apiPaciente.profissao ?? "",
    endereco: {
      logradouro: apiPaciente.endereco ?? "",
      numero: apiPaciente.numero ?? "",
      complemento: apiPaciente.complemento ?? "",
      bairro: apiPaciente.bairro ?? "",
      cidade: apiPaciente.cidade ?? "",
      estado: apiPaciente.estado ?? "",
      cep: apiPaciente.cep ?? "",
    },
    telefone: apiPaciente.celular ?? apiPaciente.telefone ?? "",
    nomePai: "",
    nomeMae: "",
    numeroSUS: apiPaciente.id_origem ?? "",
    diagnosticoOncologico: apiPaciente.diagnostico ?? "",
    diagnostico: apiPaciente.diagnostico ?? "",
    setor: apiPaciente.hospital_tratamento ?? "",
    areaTratamento: apiPaciente.origem ?? "",
    dataInicioTratamento: formatApiDate(apiPaciente.data_inicio_tratamento),
    medicoResponsavel: apiPaciente.medico_responsavel ?? "",
    status: mapApiStatusToStatusPaciente(apiPaciente.status),
    criadoEm: apiPaciente.created_at,
    atualizadoEm: apiPaciente.updated_at,
  };
}

function mapPacienteToApiPayload(
  paciente: Partial<Paciente>,
  status?: StatusPaciente,
): PacienteCreateInput {
  return {
    nome: paciente.nomeCompleto ?? paciente.nome ?? "",
    cpf: paciente.cpf ?? "",
    rg: paciente.rg,
    data_nascimento: paciente.dataNascimento ?? "",
    sexo: mapSexoToApiSexo(paciente.sexo),
    estado_civil: mapEstadoCivilToApiEstadoCivil(paciente.estadoCivil),
    profissao: paciente.profissao,
    telefone: paciente.telefone,
    celular: paciente.telefone,
    endereco: paciente.endereco?.logradouro,
    numero: paciente.endereco?.numero,
    complemento: paciente.endereco?.complemento,
    bairro: paciente.endereco?.bairro,
    cidade: paciente.endereco?.cidade,
    estado: paciente.endereco?.estado,
    cep: paciente.endereco?.cep,
    diagnostico: paciente.diagnosticoOncologico ?? paciente.diagnostico,
    hospital_tratamento: paciente.setor,
    medico_responsavel: paciente.medicoResponsavel,
    data_inicio_tratamento: paciente.dataInicioTratamento,
    status: mapStatusPacienteToApiStatus(status ?? paciente.status),
    id_origem: paciente.numeroSUS,
  };
}

interface DataContextType {
  // Dados
  usuarios: UsuarioDTO[];
  usuariosLoading: boolean;
  usuariosError: string | null;
  pacientes: Paciente[];
  pacientesLoading: boolean;
  pacientesError: string | null;
  areas: AreaAtendimento[];
  fornecedores: Fornecedor[];
  produtos: Produto[];
  produtosLoading: boolean;
  produtosError: string | null;
  cotacoes: Cotacao[];
  atendimentos: Atendimento[];
  historico: Historico[];
  documentos: Documento[];

  // Estatísticas
  getStats: () => DashboardStats;

  // Usuarios
  refreshUsuarios: () => Promise<void>;
  getUsuarioById: (id: string) => UsuarioDTO | undefined;
  addUsuario: (usuario: UsuarioCreateInput) => Promise<UsuarioDTO>;
  updateUsuario: (id: string, dados: UsuarioUpdateInput) => Promise<UsuarioDTO>;
  deleteUsuario: (id: string) => Promise<void>;

  // Pacientes
  refreshPacientes: () => Promise<void>;
  getPacienteById: (id: string) => Paciente | undefined;
  fetchPacienteById: (id: string) => Promise<Paciente>;
  addPaciente: (paciente: Partial<Paciente>) => Promise<Paciente>;
  updatePaciente: (id: string, dados: Partial<Paciente>) => Promise<Paciente>;
  deletePaciente: (id: string) => Promise<void>;
  alterarStatusPaciente: (
    id: string,
    novoStatus: StatusPaciente,
    usuarioNome: string,
  ) => Promise<void>;

  // Áreas
  getAreaById: (id: string) => AreaAtendimento | undefined;
  addArea: (area: Partial<AreaAtendimento>) => void;
  updateArea: (id: string, dados: Partial<AreaAtendimento>) => void;
  deleteArea: (id: string) => void;

  // Fornecedores
  getFornecedorById: (id: string) => Fornecedor | undefined;
  addFornecedor: (fornecedor: Partial<Fornecedor>) => void;
  updateFornecedor: (id: string, dados: Partial<Fornecedor>) => void;
  deleteFornecedor: (id: string) => void;

  // Produtos
  refreshProdutos: () => Promise<void>;
  getProdutoById: (id: string) => Produto | undefined;
  fetchProdutoById: (id: string) => Promise<Produto>;
  addProduto: (produto: Partial<Produto>) => Promise<Produto>;
  updateProduto: (id: string, dados: Partial<Produto>) => Promise<Produto>;
  desativarProduto: (id: string) => Promise<void>;

  // Cotações
  getCotacaoById: (id: string) => Cotacao | undefined;
  getCotacoesByPaciente: (pacienteId: string) => Cotacao[];
  addCotacao: (cotacao: Partial<Cotacao>) => void;
  updateCotacao: (id: string, dados: Partial<Cotacao>) => void;
  verificarCotacoesVencidas: () => void;

  // Atendimentos
  getAtendimentoById: (id: string) => Atendimento | undefined;
  getAtendimentosByPaciente: (pacienteId: string) => Atendimento[];
  addAtendimento: (atendimento: Partial<Atendimento>) => void;
  updateAtendimento: (id: string, dados: Partial<Atendimento>) => void;

  // Histórico
  getHistoricoByPaciente: (pacienteId: string) => Historico[];
  addHistorico: (historico: Historico) => void;

  // Documentos
  getDocumentosByPaciente: (pacienteId: string) => Documento[];
  addDocumento: (documento: Documento) => void;
  removeDocumento: (id: string, usuarioNome: string, pacienteId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { usuario, isLoading: authLoading } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [usuariosLoading, setUsuariosLoading] = useState(true);
  const [usuariosError, setUsuariosError] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacientesLoading, setPacientesLoading] = useState(true);
  const [pacientesError, setPacientesError] = useState<string | null>(null);
  const [areas, setAreas] = useState<AreaAtendimento[]>(areasMock);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(fornecedoresMock);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosLoading, setProdutosLoading] = useState(true);
  const [produtosError, setProdutosError] = useState<string | null>(null);
  const [cotacoes, setCotacoes] = useState<Cotacao[]>(cotacoesMock);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>(atendimentosMock);
  const [historico, setHistorico] = useState<Historico[]>(historicoMock);
  const [documentos, setDocumentos] = useState<Documento[]>(documentosMock);

  const refreshUsuarios = useCallback(async () => {
    setUsuariosLoading(true);
    setUsuariosError(null);

    try {
      const usuariosCarregados = await listarUsuarios();
      setUsuarios(usuariosCarregados);
    } catch (error) {
      setUsuariosError(
        error instanceof Error ? error.message : "Erro ao carregar usuários.",
      );
    } finally {
      setUsuariosLoading(false);
    }
  }, []);

  const refreshPacientes = useCallback(async () => {
    setPacientesLoading(true);
    setPacientesError(null);

    try {
      const pacientesCarregados = await listarPacientes();
      setPacientes(pacientesCarregados.map(mapApiPacienteToPaciente));
    } catch (error) {
      setPacientesError(
        error instanceof Error ? error.message : "Erro ao carregar pacientes.",
      );
    } finally {
      setPacientesLoading(false);
    }
  }, []);
  const refreshProdutos = useCallback(async () => {
    setProdutosLoading(true);
    setProdutosError(null);

    try {
      const produtosCarregados = await listarProdutos();
      setProdutos(produtosCarregados.map(mapApiProdutoToProduto));
    } catch (error) {
      setProdutosError(
        error instanceof Error ? error.message : "Erro ao carregar produtos.",
      );
    } finally {
      setProdutosLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!usuario) {
      setUsuarios([]);
      setUsuariosError(null);
      setUsuariosLoading(false);
      setPacientes([]);
      setPacientesError(null);
      setPacientesLoading(false);
      setProdutos([]);
      setProdutosError(null);
      setProdutosLoading(false);
      return;
    }

    void refreshUsuarios();
    void refreshPacientes();
    void refreshProdutos();
  }, [authLoading, usuario, refreshUsuarios, refreshPacientes, refreshProdutos]);

  // Usuarios
  const getUsuarioById = useCallback(
    (id: string) => {
      return usuarios.find((u) => u.id === id);
    },
    [usuarios],
  );

  const addUsuario = useCallback(async (dados: UsuarioCreateInput) => {
    const usuarioCriado = await criarUsuario(dados);
    setUsuarios((prev) => [...prev, usuarioCriado]);

    return usuarioCriado;
  }, []);

  const updateUsuario = useCallback(async (id: string, dados: UsuarioUpdateInput) => {
    const usuarioAtualizado = await atualizarUsuario(id, dados);
    setUsuarios((prev) => prev.map((u) => (u.id === id ? usuarioAtualizado : u)));

    return usuarioAtualizado;
  }, []);

  const deleteUsuario = useCallback(async (id: string) => {
    await excluirUsuario(id);
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
  }, []);

  // Estatísticas
  const getStats = useCallback((): DashboardStats => {
    const hoje = new Date().toISOString().split("T")[0];
    const cotacoesVencidas =
      cotacoes.filter((c) => c.dataValidade < hoje && c.status !== StatusCotacao.EXPIRADA)
        .length + cotacoes.filter((c) => c.status === StatusCotacao.EXPIRADA).length;

    return {
      totalPacientes: pacientes.length,
      totalAtendimentos: atendimentos.length,
      totalCotacoes: cotacoes.length,
      cotacoesVencidas,
      pacientesAtivos: pacientes.filter((p) => p.status === StatusPaciente.ATIVO).length,
      pacientesSuspensos: pacientes.filter((p) => p.status === StatusPaciente.SUSPENSO)
        .length,
      pacientesEncerrados: pacientes.filter((p) => p.status === StatusPaciente.ENCERRADO)
        .length,
    };
  }, [pacientes, atendimentos, cotacoes]);

  // Pacientes
  const getPacienteById = useCallback(
    (id: string) => {
      return pacientes.find((p) => p.id === id);
    },
    [pacientes],
  );

  const fetchPacienteById = useCallback(async (id: string) => {
    const pacienteApi = await obterPaciente(id);
    const pacienteMapeado = mapApiPacienteToPaciente(pacienteApi);

    setPacientes((prev) => {
      const pacienteExiste = prev.some((p) => p.id === pacienteMapeado.id);

      if (!pacienteExiste) {
        return [...prev, pacienteMapeado];
      }

      return prev.map((p) => (p.id === pacienteMapeado.id ? pacienteMapeado : p));
    });

    return pacienteMapeado;
  }, []);

  const addPaciente = useCallback(async (paciente: Partial<Paciente>) => {
    const payload = mapPacienteToApiPayload(
      {
        ...paciente,
        status: paciente.status ?? StatusPaciente.ATIVO,
      },
      paciente.status ?? StatusPaciente.ATIVO,
    );

    const pacienteCriado = await criarPaciente(payload);
    const pacienteMapeado = mapApiPacienteToPaciente(pacienteCriado);

    setPacientes((prev) => [...prev, pacienteMapeado]);

    return pacienteMapeado;
  }, []);

  const updatePaciente = useCallback(
    async (id: string, dados: Partial<Paciente>) => {
      const pacienteAtual = pacientes.find((p) => p.id === id);

      const payloadBase = {
        ...(pacienteAtual ?? {}),
        ...dados,
      };

      const payload = mapPacienteToApiPayload(
        payloadBase,
        dados.status ?? pacienteAtual?.status,
      );
      const pacienteAtualizado = await atualizarPaciente(
        id,
        payload as PacienteUpdateInput,
      );
      const pacienteMapeado = mapApiPacienteToPaciente(pacienteAtualizado);

      setPacientes((prev) => prev.map((p) => (p.id === id ? pacienteMapeado : p)));

      return pacienteMapeado;
    },
    [pacientes],
  );

  const deletePaciente = useCallback(async (id: string) => {
    await inativarPaciente(id);
    setPacientes((prev) =>
      prev.map((paciente) =>
        paciente.id === id
          ? {
              ...paciente,
              status: StatusPaciente.ENCERRADO,
              atualizadoEm: new Date().toISOString(),
            }
          : paciente,
      ),
    );
  }, []);

  const alterarStatusPaciente = useCallback(
    async (id: string, novoStatus: StatusPaciente, usuarioNome: string) => {
      await updatePaciente(id, { status: novoStatus });

      const novoHistorico: Historico = {
        id: `hist-${Date.now()}`,
        pacienteId: id,
        dataHora: new Date().toISOString(),
        tipoEvento: TipoEvento.STATUS,
        descricao: `Status alterado para ${novoStatus}`,
        usuarioResponsavel: usuarioNome,
      };
      setHistorico((prev) => [...prev, novoHistorico]);
    },
    [updatePaciente],
  );

  // Áreas
  const getAreaById = useCallback(
    (id: string) => {
      return areas.find((a) => a.id === id);
    },
    [areas],
  );

  const addArea = useCallback((area: Partial<AreaAtendimento>) => {
    const novaArea: AreaAtendimento = {
      id: area.id ?? `area-${Date.now()}`,
      nome: area.nome ?? "",
      descricao: area.descricao ?? "",
      ativa: area.ativa ?? true,
    };
    setAreas((prev) => [...prev, novaArea]);
  }, []);

  const updateArea = useCallback((id: string, dados: Partial<AreaAtendimento>) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, ...dados } : a)));
  }, []);

  const deleteArea = useCallback((id: string) => {
    setAreas((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Fornecedores
  const getFornecedorById = useCallback(
    (id: string) => {
      return fornecedores.find((f) => f.id === id);
    },
    [fornecedores],
  );

  const addFornecedor = useCallback((fornecedor: Partial<Fornecedor>) => {
    const novoFornecedor: Fornecedor = {
      id: fornecedor.id ?? `forn-${Date.now()}`,
      nome: fornecedor.nome ?? fornecedor.nomeFantasia ?? fornecedor.razaoSocial ?? "",
      tipoServico: fornecedor.tipoServico ?? "geral",
      contato: fornecedor.contato ?? "",
      email: fornecedor.email ?? "",
      telefone: fornecedor.telefone ?? "",
      ativo: fornecedor.ativo ?? true,
      ...fornecedor,
    };
    setFornecedores((prev) => [...prev, novoFornecedor]);
  }, []);

  const updateFornecedor = useCallback((id: string, dados: Partial<Fornecedor>) => {
    setFornecedores((prev) => prev.map((f) => (f.id === id ? { ...f, ...dados } : f)));
  }, []);

  const deleteFornecedor = useCallback((id: string) => {
    setFornecedores((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Produtos

  const getProdutoById = useCallback(
    (id: string) => {
      return produtos.find((p) => p.id === id);
    },
    [produtos],
  );

  const fetchProdutoById = useCallback(async (id: string) => {
    const produtoApi = await obterProduto(id);
    const produtoMapeado = mapApiProdutoToProduto(produtoApi);

    setProdutos((prev) => {
      const produtoExiste = prev.some((p) => p.id === produtoMapeado.id);

      if (!produtoExiste) {
        return [...prev, produtoMapeado];
      }

      return prev.map((p) => (p.id === produtoMapeado.id ? produtoMapeado : p));
    });

    return produtoMapeado;
  }, []);

  const addProduto = useCallback(async (produto: Partial<Produto>) => {
    const payload = mapProdutoToApiPayload(produto);
    const produtoApi = await criarProduto(payload);
    const produtoMapeado = mapApiProdutoToProduto(produtoApi);

    setProdutos((prev) => [...prev, produtoMapeado]);

    return produtoMapeado;
  }, []);

  const updateProduto = useCallback(
    async (id: string, dados: Partial<Produto>) => {
      const produtoAtual = produtos.find((p) => p.id === id);
      const payloadBase = { ...(produtoAtual ?? {}), ...dados };
      const payload = mapProdutoToApiPayload(payloadBase);

      const produtoApi = await atualizarProduto(id, payload as ProdutoUpdateInput);
      const produtoMapeado = mapApiProdutoToProduto(produtoApi);

      setProdutos((prev) => prev.map((p) => (p.id === id ? produtoMapeado : p)));

      return produtoMapeado;
    },
    [produtos],
  );

  const desativarProduto = useCallback(async (id: string) => {
    await desativarProdutoApi(id);
    setProdutos((prev) =>
      prev.map((produto) =>
        produto.id === id
          ? {
              ...produto,
              ativo: false,
              atualizadoEm: new Date().toISOString(),
            }
          : produto,
      ),
    );
  }, []);

  // Cotações
  const getCotacaoById = useCallback(
    (id: string) => {
      return cotacoes.find((c) => c.id === id);
    },
    [cotacoes],
  );

  const getCotacoesByPaciente = useCallback(
    (pacienteId: string) => {
      return cotacoes.filter((c) => c.pacienteId === pacienteId);
    },
    [cotacoes],
  );

  const addCotacao = useCallback((cotacao: Partial<Cotacao>) => {
    const novaCotacao: Cotacao = {
      id: cotacao.id ?? `cot-${Date.now()}`,
      pacienteId: cotacao.pacienteId ?? "",
      areaAtendimentoId: cotacao.areaAtendimentoId ?? "",
      fornecedorId: cotacao.fornecedorId ?? "",
      dataSolicitacao: cotacao.dataSolicitacao ?? new Date().toISOString().split("T")[0],
      dataValidade: cotacao.dataValidade ?? new Date().toISOString().split("T")[0],
      observacoes: cotacao.observacoes ?? "",
      status: cotacao.status ?? StatusCotacao.PENDENTE,
      itens: cotacao.itens ?? [],
      criadoPor: cotacao.criadoPor ?? usuario?.id ?? "sistema",
      criadoEm: cotacao.criadoEm ?? new Date().toISOString(),
      ...cotacao,
    };
    setCotacoes((prev) => [...prev, novaCotacao]);
  }, []);

  const updateCotacao = useCallback((id: string, dados: Partial<Cotacao>) => {
    setCotacoes((prev) => prev.map((c) => (c.id === id ? { ...c, ...dados } : c)));
  }, []);

  const verificarCotacoesVencidas = useCallback(() => {
    const hoje = new Date().toISOString().split("T")[0];
    setCotacoes((prev) =>
      prev.map((c) => {
        if (c.dataValidade < hoje && c.status !== StatusCotacao.EXPIRADA) {
          return { ...c, status: StatusCotacao.EXPIRADA };
        }
        return c;
      }),
    );
  }, []);

  // Atendimentos
  const getAtendimentoById = useCallback(
    (id: string) => {
      return atendimentos.find((a) => a.id === id);
    },
    [atendimentos],
  );

  const getAtendimentosByPaciente = useCallback(
    (pacienteId: string) => {
      return atendimentos.filter((a) => a.pacienteId === pacienteId);
    },
    [atendimentos],
  );

  const addAtendimento = useCallback((atendimento: Partial<Atendimento>) => {
    const novoAtendimento: Atendimento = {
      id: atendimento.id ?? `atend-${Date.now()}`,
      pacienteId: atendimento.pacienteId ?? "",
      data:
        atendimento.data ??
        atendimento.dataHora?.split("T")[0] ??
        new Date().toISOString().split("T")[0],
      areaAtendimentoId: atendimento.areaAtendimentoId ?? atendimento.areaId ?? "",
      tipoAtendimento: atendimento.tipoAtendimento ?? atendimento.tipo ?? "",
      descricao: atendimento.descricao ?? "",
      cotacaoId: atendimento.cotacaoId,
      criadoPor:
        atendimento.criadoPor ?? atendimento.responsavelId ?? usuario?.id ?? "sistema",
      criadoEm: atendimento.criadoEm ?? new Date().toISOString(),
      ...atendimento,
    };
    setAtendimentos((prev) => [...prev, novoAtendimento]);
  }, []);

  const updateAtendimento = useCallback((id: string, dados: Partial<Atendimento>) => {
    setAtendimentos((prev) => prev.map((a) => (a.id === id ? { ...a, ...dados } : a)));
  }, []);

  // Histórico
  const getHistoricoByPaciente = useCallback(
    (pacienteId: string) => {
      return historico
        .filter((h) => h.pacienteId === pacienteId)
        .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
    },
    [historico],
  );

  const addHistorico = useCallback((novoHistorico: Historico) => {
    setHistorico((prev) => [...prev, novoHistorico]);
  }, []);

  // Documentos
  const getDocumentosByPaciente = useCallback(
    (pacienteId: string) => {
      return documentos.filter((d) => d.pacienteId === pacienteId);
    },
    [documentos],
  );

  const addDocumento = useCallback((documento: Documento) => {
    setDocumentos((prev) => [...prev, documento]);
  }, []);

  const removeDocumento = useCallback(
    (id: string, usuarioNome: string, pacienteId: string) => {
      const doc = documentos.find((d) => d.id === id);
      if (doc) {
        setDocumentos((prev) => prev.filter((d) => d.id !== id));

        const novoHistorico: Historico = {
          id: `hist-${Date.now()}`,
          pacienteId,
          dataHora: new Date().toISOString(),
          tipoEvento: TipoEvento.DOCUMENTO,
          descricao: `Documento "${doc.nomeArquivo}" removido`,
          usuarioResponsavel: usuarioNome,
        };
        setHistorico((prev) => [...prev, novoHistorico]);
      }
    },
    [documentos],
  );

  return (
    <DataContext.Provider
      value={{
        usuarios,
        usuariosLoading,
        usuariosError,
        pacientes,
        pacientesLoading,
        pacientesError,
        areas,
        fornecedores,
        produtos,
        produtosLoading,
        produtosError,
        cotacoes,
        atendimentos,
        historico,
        documentos,
        getStats,
        refreshUsuarios,
        getUsuarioById,
        addUsuario,
        updateUsuario,
        deleteUsuario,
        refreshPacientes,
        getPacienteById,
        fetchPacienteById,
        addPaciente,
        updatePaciente,
        deletePaciente,
        alterarStatusPaciente,
        getAreaById,
        addArea,
        updateArea,
        deleteArea,
        getFornecedorById,
        addFornecedor,
        updateFornecedor,
        deleteFornecedor,
        getProdutoById,
        addProduto,
        updateProduto,
        refreshProdutos,
        fetchProdutoById,
        desativarProduto,
        getCotacaoById,
        getCotacoesByPaciente,
        addCotacao,
        updateCotacao,
        verificarCotacoesVencidas,
        getAtendimentoById,
        getAtendimentosByPaciente,
        addAtendimento,
        updateAtendimento,
        getHistoricoByPaciente,
        addHistorico,
        getDocumentosByPaciente,
        addDocumento,
        removeDocumento,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData deve ser usado dentro de um DataProvider");
  }
  return context;
}
