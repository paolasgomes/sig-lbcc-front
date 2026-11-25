
import { api } from "./api";

export interface RelatorioPeriodoResponse {
    periodo: {
        data_inicio: string;
        data_fim: string;
    };
    resumo: {
        total_atendimentos: number;
        total_pacientes: number;
        total_cotacoes: number;
        total_ordens_fornecimento: number;
        total_ordens_transporte: number;
        valor_total_fornecimento: number;
        valor_total_transporte: number;
        valor_total_geral_parcial: boolean;
        total_divergencias: number;
        total_cancelamentos_aprovados: number;
        ordens_transporte_sem_valor_calculado: number;
    };
    atendimentos: Record<string, any>[];
    cotacoes: Record<string, any>[];
    ordens_fornecimento: Record<string, any>[];
    ordens_transporte: Record<string, any>[];
    divergencias: Record<string, any>[];
    cancelamentos: Record<string, any>[];
}

export async function buscarRelatorioPorPeriodo(
    dataInicio: string,
    dataFim: string,
    ): Promise<RelatorioPeriodoResponse> {
    const { data } = await api.get<RelatorioPeriodoResponse>(
        "/relatorios/periodo",
        {
        params: {
            data_inicio: dataInicio,
            data_fim: dataFim,
        },
        },
    );

    return data;
}
