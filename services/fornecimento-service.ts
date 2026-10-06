import { api } from "@/services/api";

export interface OrdemFornecimentoItem {
    id: string;
    ordem_fornecimento_id: string;
    cotacao_item_id: string | null;
    proposta_id: string | null;
    produto_id: string | null;
    descricao: string;
    quantidade_solicitada: number;
    quantidade_entregue: number;
    unidade: string;
    valor_unitario: number;
    valor_total: number;
    observacoes: string | null;
}

export interface FornecedorOrdemFornecimento {
    id: string;
    razao_social: string;
    nome_fantasia: string | null;
    cnpj: string | null;
    email: string | null;
    telefone: string | null;
}

export type StatusPrazo =
    | "normal"
    | "proxima_expiracao"
    | "atrasada";

export type StatusEnvioOrdem =
    | "nao_enviado"
    | "pendente"
    | "enviando"
    | "enviado"
    | "falhou_retentando"
    | "falhou_definitivo";

export interface EnvioOrdemFornecimento {
    id: string;
    ciclo: number;
    tentativa: number;
    tipo: "automatico" | "manual";
    status: "pendente" | "enviando" | "enviado" | "falhou";
    destinatario_email: string | null;
    assunto: string | null;
    nome_arquivo: string | null;
    pdf_versao: number;
    message_id: string | null;
    erro: string | null;
    metadados: Record<string, unknown>;
    agendado_em: string;
    iniciado_em: string | null;
    enviado_em: string | null;
    falhou_em: string | null;
    created_at: string;
}

export interface GestorResponsavel {
    id: string;
    nome: string;
    email: string;
    perfil: string;
    ativo: boolean;
}

export interface OrdemFornecimentoPrazoHistorico {
    id: string;
    ciclo: number;
    data_limite: string | null;
    status_prazo: StatusPrazo;
    tipo_evento: string;
    responsavel_ids: string[];
    usuario_id: string | null;
    created_at: string;
}

export interface OrdemFornecimento {
    id: string;
    numero: string;
    cotacao_id: string;
    proposta_id: string | null;
    fornecedor_id: string;
    paciente_id: string;
    status: string;
    data_emissao: string;
    data_envio: string | null;
    recebido_em: string | null;
    recebido_por: string | null;
    status_envio: StatusEnvioOrdem;
    email_envio_tentativas: number;
    email_envio_proxima_tentativa: string | null;
    email_envio_ultimo_erro: string | null;
    email_envio_ultima_tentativa_em: string | null;
    email_envio_ultimo_sucesso_em: string | null;
    data_previsao_entrega: string | null;
    data_entrega: string | null;
    data_finalizacao: string | null;
    prazo_ciclo: number;
    status_prazo: StatusPrazo;
    prazo_atualizado_em: string | null;
    valor_total: number;
    observacoes: string | null;
    criado_por: string | null;
    atualizado_por: string | null;
    created_at: string;
    updated_at: string;
    fornecedores: FornecedorOrdemFornecimento | null;
    ordem_fornecimento_itens: OrdemFornecimentoItem[];
    gestores_responsaveis: GestorResponsavel[];
    prazo_historico?: OrdemFornecimentoPrazoHistorico[];
    envios_email?: EnvioOrdemFornecimento[];
}

export async function listarOrdensDeFornecimento(): Promise<
        OrdemFornecimento[]
    > {
        const response = await api.get("/fornecimento");

        return response.data;
    }

export async function obterOrdemDeFornecimento(
    id: string,
    ): Promise<OrdemFornecimento> {
    const response = await api.get(
        `/fornecimento/${id}`,
    );

    return response.data;
    }

export async function gerarOrdensDeFornecimento(
    cotacaoId: string
    ): Promise<OrdemFornecimento[]> {
    const response = await api.post(
        `/fornecimento/cotacoes/${cotacaoId}/gerar`
    );

    return response.data;
    }
export async function confirmarRecebimentoOrdemDeFornecimento(
    id: string
): Promise<OrdemFornecimento> {
    const response = await api.patch(
        `/fornecimento/${id}/confirmar-recebimento`
    );

    return response.data.data;
}

export async function reenviarEmailOrdemDeFornecimento(
    id: string,
): Promise<EnvioOrdemFornecimento> {
    const response = await api.post(`/fornecimento/${id}/email/reenvio`);
    return response.data.data;
}

export async function baixarPdfOrdemDeFornecimento(
    id: string,
): Promise<{ blob: Blob; filename: string; origem: string }> {
    const response = await api.get(`/fornecimento/${id}/pdf`, {
        responseType: "blob",
    });

    const disposition = String(response.headers["content-disposition"] ?? "");
    const filename =
        disposition.match(/filename="?([^";]+)"?/i)?.[1] ??
        "ordem-fornecimento.pdf";

    return {
        blob: response.data,
        filename,
        origem: String(response.headers["x-ordem-pdf-origem"] ?? "gerado_atual"),
    };
}

export async function finalizarOrdemDeFornecimento(
    id: string,
): Promise<OrdemFornecimento> {
    const response = await api.patch(`/fornecimento/${id}/finalizar`);
    return response.data;
}

export async function listarGestoresResponsaveis(): Promise<GestorResponsavel[]> {
    const response = await api.get("/fornecimento/gestores-responsaveis");
    return response.data;
}

export async function atualizarPrazoOrdemDeFornecimento(
    id: string,
    dados: {
        data_previsao_entrega: string | null;
        responsavel_ids: string[];
    },
): Promise<OrdemFornecimento> {
    const response = await api.patch(`/fornecimento/${id}/prazo`, dados);
    return response.data;
}
