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
    data_previsao_entrega: string | null;
    data_entrega: string | null;
    data_finalizacao: string | null;
    valor_total: number;
    observacoes: string | null;
    criado_por: string | null;
    atualizado_por: string | null;
    created_at: string;
    updated_at: string;
    fornecedores: FornecedorOrdemFornecimento | null;
    ordem_fornecimento_itens: OrdemFornecimentoItem[];
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