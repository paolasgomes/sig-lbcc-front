"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
Eye,
FileText,
Mail,
Search,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";

import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from "@/components/ui/table";

import { Empty } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { TableActions } from "@/components/ui/table-actions";

import { useOrdensDeFornecimento } from "@/hooks/use-fornecimento";

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

function getFornecedorNome(ordem: any) {
return (
    ordem.fornecedores?.nome_fantasia ||
    ordem.fornecedores?.razao_social ||
    "-"
);
}

function formatStatus(status: string) {
const statusMap: Record<string, string> = {
    rascunho: "Rascunho",
    enviada: "Enviada",
    em_entrega: "Em entrega",
    entregue: "Entregue",
    finalizada: "Finalizada",
    cancelada: "Cancelada",
};

return statusMap[status] ?? status;
}

type OrdenacaoOrdem =
| "mais_recentes"
| "mais_antigas"
| "numero_crescente"
| "numero_decrescente";

export default function FornecimentoPage() {
const {
    ordens,
    isLoading,
    error,
} = useOrdensDeFornecimento();

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] =
    useState("todos");

const [ordenacao, setOrdenacao] =
    useState<OrdenacaoOrdem>(
    "mais_recentes",
    );

const filteredOrdens = useMemo(() => {
    const searchValue =
    search.trim().toLowerCase();

    const filtradas = ordens.filter(
    (ordem) => {
        const fornecedor =
        getFornecedorNome(ordem).toLowerCase();

    const numeroCotacao = ordem.cotacao_id?.toLowerCase() ?? "";

        const matchesSearch =
        !searchValue ||
        ordem.numero
            .toLowerCase()
            .includes(searchValue) ||
        fornecedor.includes(searchValue) ||
        numeroCotacao.includes(searchValue) ||
        ordem.cotacao_id
            .toLowerCase()
            .includes(searchValue);

        const matchesStatus =
        statusFilter === "todos" ||
        ordem.status.toLowerCase() ===
            statusFilter.toLowerCase();

        return (
        matchesSearch &&
        matchesStatus
        );
    },
    );

    return [...filtradas].sort(
    (a, b) => {
        switch (ordenacao) {
        case "mais_antigas":
            return (
            new Date(
                a.data_emissao,
            ).getTime() -
            new Date(
                b.data_emissao,
            ).getTime()
            );

        case "numero_crescente":
            return a.numero.localeCompare(
            b.numero,
            undefined,
            { numeric: true },
            );

        case "numero_decrescente":
            return b.numero.localeCompare(
            a.numero,
            undefined,
            { numeric: true },
            );

        case "mais_recentes":
        default:
            return (
            new Date(
                b.data_emissao,
            ).getTime() -
            new Date(
                a.data_emissao,
            ).getTime()
            );
        }
    },
    );
}, [
    ordens,
    search,
    statusFilter,
    ordenacao,
]);

function handleStatusChange(
    value: string,
) {
    setStatusFilter(value);
}

function handleOrdenacaoChange(
    value: OrdenacaoOrdem,
) {
    setOrdenacao(value);
}

return (
    <DashboardLayout>
    <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
        <h1 className="text-2xl font-semibold">
            Ordens de Fornecimento
        </h1>

        <p className="text-sm text-muted-foreground">
            Acompanhe as ordens de fornecimento
            geradas a partir das cotações.
        </p>
        </div>

        {/* Filtros */}
        <Card>
        <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                placeholder="Buscar por ordem, fornecedor ou cotação..."
                value={search}
                onChange={(event) =>
                    setSearch(
                    event.target.value,
                    )
                }
                className="pl-9"
                />
            </div>

            <Select
                value={statusFilter}
                onValueChange={
                handleStatusChange
                }
            >
                <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>

                <SelectContent>
                <SelectItem value="todos">
                    Todos os status
                </SelectItem>

                <SelectItem value="rascunho">
                    Rascunho
                </SelectItem>

                <SelectItem value="enviada">
                    Enviada
                </SelectItem>

                <SelectItem value="em_entrega">
                    Em entrega
                </SelectItem>

                <SelectItem value="entregue">
                    Entregue
                </SelectItem>

                <SelectItem value="finalizada">
                    Finalizada
                </SelectItem>

                <SelectItem value="cancelada">
                    Cancelada
                </SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={ordenacao}
                onValueChange={
                handleOrdenacaoChange
                }
            >
                <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>

                <SelectContent>
                <SelectItem value="mais_recentes">
                    Mais recentes
                </SelectItem>

                <SelectItem value="mais_antigas">
                    Mais antigas
                </SelectItem>

                <SelectItem value="numero_crescente">
                    Número crescente
                </SelectItem>

                <SelectItem value="numero_decrescente">
                    Número decrescente
                </SelectItem>
                </SelectContent>
            </Select>
            </div>
        </CardContent>
        </Card>

        {/* Erro */}
        {error && (
        <Card>
            <CardContent className="pt-6">
            <p className="text-sm text-destructive">
                Erro ao carregar as ordens de
                fornecimento: {error}
            </p>
            </CardContent>
        </Card>
        )}

        {/* Listagem */}
        <Card>
        <CardContent className="p-0">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>
                    Ordem
                </TableHead>

                <TableHead>
                    Fornecedor
                </TableHead>

                <TableHead>
                    Data de emissão
                </TableHead>

                <TableHead>
                    Valor total
                </TableHead>

                <TableHead>
                    Status
                </TableHead>

                <TableHead className="text-right">
                    Ações
                </TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {isLoading ? (
                <TableRow>
                    <TableCell
                    colSpan={6}
                    className="py-8 text-center"
                    >
                    Carregando ordens de
                    fornecimento...
                    </TableCell>
                </TableRow>
                ) : filteredOrdens.length ===
                0 ? (
                <TableRow>
                    <TableCell colSpan={6}>
                    <Empty
                        title="Nenhuma ordem de fornecimento encontrada"
                        description={
                        search ||
                        statusFilter !==
                            "todos"
                            ? "Tente alterar os filtros utilizados."
                            : "Ainda não existem ordens de fornecimento."
                        }
                    />
                    </TableCell>
                </TableRow>
                ) : (
                filteredOrdens.map(
                    (ordem) => (
                    <TableRow
                        key={ordem.id}
                    >
                        {/* Ordem + Cotação */}
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium">{ordem.numero}</span>
                                <span className="text-xs text-muted-foreground">
                                    Cotação #{ordem.cotacao_id.slice(0, 8)}
                                </span>
                            </div>
                        </TableCell>

                        {/* Fornecedor */}
                        <TableCell>
                        {getFornecedorNome(
                            ordem,
                        )}
                        </TableCell>

                        {/* Data */}
                        <TableCell>
                        {formatDate(
                            ordem.data_emissao,
                        )}
                        </TableCell>

                        {/* Valor */}
                        <TableCell>
                        {formatCurrency(
                            Number(
                            ordem.valor_total,
                            ),
                        )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                        <Badge variant="outline">
                            {formatStatus(
                            ordem.status,
                            )}
                        </Badge>
                        </TableCell>

                        {/* Ações */}
                        <TableCell className="text-right">
                        <TableActions>
                            <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            title="Visualizar ordem"
                            >
                            <Link href={`/fornecimento/${ordem.id}`}>
                                <Eye className="h-4 w-4" />
                            </Link>
                            </Button>

                            <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Gerar PDF"
                            
                            >
                            <FileText className="h-4 w-4" />
                            </Button>

                            <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Enviar ordem"
                            
                            >
                            <Mail className="h-4 w-4" />
                            </Button>
                        </TableActions>
                        </TableCell>
                    </TableRow>
                    ),
                )
                )}
            </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
    </DashboardLayout>
);
}