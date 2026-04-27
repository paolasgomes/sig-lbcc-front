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
} from "@/types";
import {
  pacientesMock,
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

interface DataContextType {
  // Dados
  usuarios: UsuarioDTO[];
  usuariosLoading: boolean;
  usuariosError: string | null;
  pacientes: Paciente[];
  areas: AreaAtendimento[];
  fornecedores: Fornecedor[];
  produtos: Produto[];
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
  getPacienteById: (id: string) => Paciente | undefined;
  addPaciente: (paciente: Paciente) => void;
  updatePaciente: (id: string, dados: Partial<Paciente>) => void;
  alterarStatusPaciente: (
    id: string,
    novoStatus: StatusPaciente,
    usuarioNome: string,
  ) => void;

  // Áreas
  getAreaById: (id: string) => AreaAtendimento | undefined;
  addArea: (area: AreaAtendimento) => void;
  updateArea: (id: string, dados: Partial<AreaAtendimento>) => void;

  // Fornecedores
  getFornecedorById: (id: string) => Fornecedor | undefined;
  addFornecedor: (fornecedor: Fornecedor) => void;
  updateFornecedor: (id: string, dados: Partial<Fornecedor>) => void;

  // Produtos
  getProdutoById: (id: string) => Produto | undefined;
  addProduto: (produto: Produto) => void;
  updateProduto: (id: string, dados: Partial<Produto>) => void;

  // Cotações
  getCotacaoById: (id: string) => Cotacao | undefined;
  getCotacoesByPaciente: (pacienteId: string) => Cotacao[];
  addCotacao: (cotacao: Cotacao) => void;
  updateCotacao: (id: string, dados: Partial<Cotacao>) => void;
  verificarCotacoesVencidas: () => void;

  // Atendimentos
  getAtendimentoById: (id: string) => Atendimento | undefined;
  getAtendimentosByPaciente: (pacienteId: string) => Atendimento[];
  addAtendimento: (atendimento: Atendimento) => void;

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
  const [pacientes, setPacientes] = useState<Paciente[]>(pacientesMock);
  const [areas, setAreas] = useState<AreaAtendimento[]>(areasMock);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(fornecedoresMock);
  const [produtos, setProdutos] = useState<Produto[]>(produtosMock);
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
      setUsuariosError(error instanceof Error ? error.message : "Erro ao carregar usuários.");
    } finally {
      setUsuariosLoading(false);
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
      return;
    }

    void refreshUsuarios();
  }, [authLoading, usuario, refreshUsuarios]);

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

  const addPaciente = useCallback((paciente: Paciente) => {
    setPacientes((prev) => [...prev, paciente]);
  }, []);

  const updatePaciente = useCallback((id: string, dados: Partial<Paciente>) => {
    setPacientes((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...dados, atualizadoEm: new Date().toISOString() } : p,
      ),
    );
  }, []);

  const alterarStatusPaciente = useCallback(
    (id: string, novoStatus: StatusPaciente, usuarioNome: string) => {
      updatePaciente(id, { status: novoStatus });

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

  const addArea = useCallback((area: AreaAtendimento) => {
    setAreas((prev) => [...prev, area]);
  }, []);

  const updateArea = useCallback((id: string, dados: Partial<AreaAtendimento>) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, ...dados } : a)));
  }, []);

  // Fornecedores
  const getFornecedorById = useCallback(
    (id: string) => {
      return fornecedores.find((f) => f.id === id);
    },
    [fornecedores],
  );

  const addFornecedor = useCallback((fornecedor: Fornecedor) => {
    setFornecedores((prev) => [...prev, fornecedor]);
  }, []);

  const updateFornecedor = useCallback((id: string, dados: Partial<Fornecedor>) => {
    setFornecedores((prev) => prev.map((f) => (f.id === id ? { ...f, ...dados } : f)));
  }, []);

  // Produtos
  const getProdutoById = useCallback(
    (id: string) => {
      return produtos.find((p) => p.id === id);
    },
    [produtos],
  );

  const addProduto = useCallback((produto: Produto) => {
    setProdutos((prev) => [...prev, produto]);
  }, []);

  const updateProduto = useCallback((id: string, dados: Partial<Produto>) => {
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, ...dados } : p)));
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

  const addCotacao = useCallback((cotacao: Cotacao) => {
    setCotacoes((prev) => [...prev, cotacao]);
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

  const addAtendimento = useCallback((atendimento: Atendimento) => {
    setAtendimentos((prev) => [...prev, atendimento]);
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
        areas,
        fornecedores,
        produtos,
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
        getPacienteById,
        addPaciente,
        updatePaciente,
        alterarStatusPaciente,
        getAreaById,
        addArea,
        updateArea,
        getFornecedorById,
        addFornecedor,
        updateFornecedor,
        getProdutoById,
        addProduto,
        updateProduto,
        getCotacaoById,
        getCotacoesByPaciente,
        addCotacao,
        updateCotacao,
        verificarCotacoesVencidas,
        getAtendimentoById,
        getAtendimentosByPaciente,
        addAtendimento,
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
