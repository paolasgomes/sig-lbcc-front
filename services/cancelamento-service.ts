import { api } from "@/services/api";

export interface SolicitarCancelamentoPayload {
    ordem_fornecimento_id: string | null;
    ordem_transporte_id: string | null;
    motivo: string;
    necessidade_paciente?: "continua" | "encerrada";
}

export interface DecidirCancelamentoPayload {
    aprovado: boolean;
    justificativa: string;
    gerar_recotacao?: boolean;
    data_validade_recotacao?: string;
}

export async function solicitarCancelamento(
        dados: SolicitarCancelamentoPayload,
    ): Promise<unknown> {
        const response = await api.post(
        "/fornecimento/cancelamentos/solicitar",
        dados,
        );

        return response.data;
    }

export async function decidirCancelamento(
    solicitacaoId: string,
    dados: DecidirCancelamentoPayload,
    ): Promise<unknown> {
    const response = await api.patch(
        `/fornecimento/cancelamentos/${solicitacaoId}/decidir`,
        dados,
    );

    return response.data;
    }

export interface SolicitacaoCancelamentoDireto {
    id: string;
    divergencia_id: null;
    ordem_fornecimento_id: string | null;
    recotacao_id: string | null;
    data_validade_cotacao_original: string | null;
    ordem_transporte_id: string | null;
    status: "solicitada" | "aprovada" | "recusada";
    motivo: string;
    necessidade_paciente: "continua" | "encerrada";
    justificativa_decisao: string | null;
    solicitado_por: string;
    decidido_por: string | null;
    solicitado_em: string;
    decidido_em: string | null;
    
}

export async function listarCancelamentosDiretos(): Promise<SolicitacaoCancelamentoDireto[]> {
    const response = await api.get("/fornecimento/cancelamentos");
    return response.data;
}