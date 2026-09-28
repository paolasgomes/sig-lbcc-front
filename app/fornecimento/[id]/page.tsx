"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft } from "lucide-react";


import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from "@/components/ui/table";

import { useOrdemDeFornecimento } from "@/hooks/use-fornecimento";

function formatDate(date: string | null) {
if (!date) return "-";

const [year, month, day] = date.split("-");

if (!year || !month || !day) return date;

return `${day}/${month}/${year}`;
}

function formatCurrency(value: number) {
return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
}).format(value);
}

export default function OrdemDeFornecimentoPage({
params,
}: {
params: Promise<{ id: string }>;
}) {
const { id } = use(params);

const { ordem, isLoading, error } = useOrdemDeFornecimento(id);

if (isLoading) {
    return (
    <DashboardLayout>
        <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
            Carregando ordem de fornecimento...
        </p>
        </div>
    </DashboardLayout>
    );
}

if (error || !ordem) {
    return (
    <DashboardLayout>
        <div className="space-y-6">
        <Button asChild variant="outline">
            <Link href="/fornecimento">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
            </Link>
        </Button>

        <Card>
            <CardContent className="pt-6">
            <p className="text-sm text-destructive">
                {error || "Ordem de fornecimento não encontrada."}
            </p>
            </CardContent>
        </Card>
        </div>
    </DashboardLayout>
    );
}

const fornecedor =
    ordem.fornecedores?.nome_fantasia ||
    ordem.fornecedores?.razao_social ||
    "-";

return (
    <DashboardLayout>
    <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="icon">
            <Link href="/fornecimento">
                <ArrowLeft className="h-4 w-4" />
            </Link>
            </Button>

            <div>
            <h1 className="text-2xl font-semibold">
                Ordem de Fornecimento
            </h1>

            <p className="text-sm text-muted-foreground">
                {ordem.numero}
            </p>
            </div>
        </div>

        <Badge variant="outline">
            {ordem.status}
        </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
            <CardTitle>Fornecedor</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
            <div>
                <p className="text-sm text-muted-foreground">
                Nome
                </p>

                <p className="font-medium">
                {fornecedor}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                CNPJ
                </p>

                <p>
                {ordem.fornecedores?.cnpj || "-"}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                Telefone
                </p>

                <p>
                {ordem.fornecedores?.telefone || "-"}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                E-mail
                </p>

                <p>
                {ordem.fornecedores?.email || "-"}
                </p>
            </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <CardTitle>Informações da ordem</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
            <div>
                <p className="text-sm text-muted-foreground">
                Cotação
                </p>

                <p className="font-medium">
                {ordem.cotacao_id}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                Data de emissão
                </p>

                <p>
                {formatDate(ordem.data_emissao)}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                Previsão de entrega
                </p>

                <p>
                {formatDate(ordem.data_previsao_entrega)}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                Data de entrega
                </p>

                <p>
                {formatDate(ordem.data_entrega)}
                </p>
            </div>

            <div>
                <p className="text-sm text-muted-foreground">
                Data de finalização
                </p>

                <p>
                {formatDate(ordem.data_finalizacao)}
                </p>
            </div>
            </CardContent>
        </Card>
        </div>

        <Card>
        <CardHeader>
            <CardTitle>Itens da ordem</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Valor unitário</TableHead>
                <TableHead>Valor total</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {ordem.ordem_fornecimento_itens.length === 0 ? (
                <TableRow>
                    <TableCell
                    colSpan={5}
                    className="text-center py-8"
                    >
                    Nenhum item encontrado.
                    </TableCell>
                </TableRow>
                ) : (
                ordem.ordem_fornecimento_itens.map((item) => (
                    <TableRow key={item.id}>
                    <TableCell>
                        {item.descricao}
                    </TableCell>

                    <TableCell>
                        {item.quantidade_solicitada}
                    </TableCell>

                    <TableCell>
                        {item.unidade}
                    </TableCell>

                    <TableCell>
                        {formatCurrency(
                        Number(item.valor_unitario)
                        )}
                    </TableCell>

                    <TableCell>
                        {formatCurrency(
                        Number(item.valor_total)
                        )}
                    </TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
            </Table>
        </CardContent>
        </Card>

        <Card>
        <CardContent className="pt-6">
            <div className="flex justify-end">
            <div className="text-right">
                <p className="text-sm text-muted-foreground">
                Valor total
                </p>

                <p className="text-2xl font-semibold">
                {formatCurrency(Number(ordem.valor_total))}
                </p>
            </div>
            </div>
        </CardContent>
        </Card>

        {ordem.observacoes && (
        <Card>
            <CardHeader>
            <CardTitle>Observações</CardTitle>
            </CardHeader>

            <CardContent>
            <p className="text-sm whitespace-pre-wrap">
                {ordem.observacoes}
            </p>
            </CardContent>
        </Card>
        )}
    </div>
    </DashboardLayout>
);
}