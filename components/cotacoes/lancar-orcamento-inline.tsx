    "use client";

    import { useMemo, useRef, useState } from "react";
    import { Plus, Trash2 } from "lucide-react";

    import { useFornecedores } from "@/hooks/use-fornecedores";
    import type { OrcamentoBlocoInput } from "@/types";

    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";

    import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    } from "@/components/ui/select";

    import {
    Alert,
    AlertDescription,
    } from "@/components/ui/alert";

    import {
    TableCell,
    TableRow,
} from "@/components/ui/table";

    interface BlocoForm {
    key: number;
    fornecedorId: string;
    valorUnitario: string;
    }

    interface LancarOrcamentoInlineProps {
    disabled?: boolean;
    isSubmitting?: boolean;
    fornecedorIdsNoItem?: string[];
    onSubmit: (
        blocos: OrcamentoBlocoInput[],
    ) => Promise<void>;
    onCancel: () => void;
    }

    function blocoVazio(
    key: number,
    ): BlocoForm {
    return {
        key,
        fornecedorId: "",
        valorUnitario: "",
    };
    }

    export function LancarOrcamentoInline({
    disabled = false,
    isSubmitting = false,
    fornecedorIdsNoItem = [],
    onSubmit,
    onCancel,
    }: LancarOrcamentoInlineProps) {
    const { fornecedores, isLoading } =
        useFornecedores();

    const proximaChave = useRef(1);

    const [blocos, setBlocos] = useState<
        BlocoForm[]
    >([blocoVazio(0)]);

    const [submitError, setSubmitError] =
        useState<string | null>(null);

    const fornecedoresAtivos = useMemo(
        () =>
        fornecedores.filter(
            (fornecedor) =>
            fornecedor.ativo,
        ),
        [fornecedores],
    );

    const idsJaNoItem = useMemo(
        () =>
        new Set(
            fornecedorIdsNoItem,
        ),
        [fornecedorIdsNoItem],
    );

    const atualizarBloco = (
        key: number,
        campo:
        | "fornecedorId"
        | "valorUnitario",
        valor: string,
    ) => {
        setBlocos((atuais) =>
        atuais.map((bloco) =>
            bloco.key === key
            ? {
                ...bloco,
                [campo]: valor,
                }
            : bloco,
        ),
        );
    };

    const adicionarBloco = () => {
        const key =
        proximaChave.current;

        proximaChave.current += 1;

        setBlocos((atuais) => [
        ...atuais,
        blocoVazio(key),
        ]);
    };

    const removerBloco = (
        key: number,
    ) => {
        setBlocos((atuais) =>
        atuais.filter(
            (bloco) =>
            bloco.key !== key,
        ),
        );
    };

    const fornecedoresDoBloco = (
        bloco: BlocoForm,
    ) => {
        const idsOutrosBlocos =
        new Set(
            blocos
            .filter(
                (outro) =>
                outro.key !== bloco.key &&
                outro.fornecedorId,
            )
            .map(
                (outro) =>
                outro.fornecedorId,
            ),
        );

        return fornecedoresAtivos.filter(
        (fornecedor) => {
            if (
            fornecedor.id ===
            bloco.fornecedorId
            ) {
            return true;
            }

            if (
            idsJaNoItem.has(
                fornecedor.id,
            )
            ) {
            return false;
            }

            return !idsOutrosBlocos.has(
            fornecedor.id,
            );
        },
        );
    };

    const idsReservados = useMemo(() => {
        const ids = new Set(
        idsJaNoItem,
        );

        for (const bloco of blocos) {
        if (bloco.fornecedorId) {
            ids.add(
            bloco.fornecedorId,
            );
        }
        }

        return ids;
    }, [blocos, idsJaNoItem]);

    const podeAdicionarBloco =
        fornecedoresAtivos.some(
        (fornecedor) =>
            !idsReservados.has(
            fornecedor.id,
            ),
        );

    const blocosIncompletos =
        blocos.length === 0 ||
        blocos.some(
        (bloco) =>
            !bloco.fornecedorId ||
            !bloco.valorUnitario,
        );

    const resetForm = () => {
        proximaChave.current = 1;

        setBlocos([
        blocoVazio(0),
        ]);

        setSubmitError(null);
    };

    const handleCancel = () => {
        resetForm();
        onCancel();
    };

    const handleConfirm =
        async () => {
        const payload: OrcamentoBlocoInput[] =
            [];

        for (const bloco of blocos) {
            const valor = Number(
            bloco.valorUnitario.replace(
                ",",
                ".",
            ),
            );

            if (
            !bloco.fornecedorId ||
            Number.isNaN(valor) ||
            valor <= 0
            ) {
            setSubmitError(
                "Informe um fornecedor ativo e um valor unitário maior que zero.",
            );

            return;
            }

            payload.push({
            fornecedorId:
                bloco.fornecedorId,
            valorUnitario: valor,
            });
        }

        const fornecedorIds =
            payload.map(
            (bloco) =>
                bloco.fornecedorId,
            );

        if (
            new Set(fornecedorIds).size !==
            fornecedorIds.length
        ) {
            setSubmitError(
            "Não é permitido repetir o mesmo fornecedor no mesmo item.",
            );

            return;
        }

        setSubmitError(null);

        try {
            await onSubmit(payload);
            resetForm();
        } catch (error) {
            setSubmitError(
            error instanceof Error
                ? error.message
                : "Erro ao registrar orçamento.",
            );
        }
        };

    if (disabled) {
        return null;
    }

    return (
        <>
        {/* Linhas de novos orçamentos */}
        {blocos.map(
            (bloco) => (
            <TableRow
                key={bloco.key}
                className="bg-muted/20"
            >
                <TableCell>
                <Select
                    value={
                    bloco.fornecedorId
                    }
                    onValueChange={(
                    value,
                    ) =>
                    atualizarBloco(
                        bloco.key,
                        "fornecedorId",
                        value,
                    )
                    }
                    disabled={
                    isLoading ||
                    isSubmitting
                    }
                >
                    <SelectTrigger className="w-full min-w-[220px]">
                    <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>

                    <SelectContent>
                    {fornecedoresDoBloco(
                        bloco,
                    ).map(
                        (
                        fornecedor,
                        ) => (
                        <SelectItem
                            key={
                            fornecedor.id
                            }
                            value={
                            fornecedor.id
                            }
                        >
                            {fornecedor.nomeFantasia ||
                            fornecedor.razaoSocial}
                        </SelectItem>
                        ),
                    )}
                    </SelectContent>
                </Select>
                </TableCell>

                <TableCell>
                <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={
                    bloco.valorUnitario
                    }
                    onChange={(
                    event,
                    ) =>
                    atualizarBloco(
                        bloco.key,
                        "valorUnitario",
                        event.target
                        .value,
                    )
                    }
                    disabled={
                    isSubmitting
                    }
                    className="ml-auto w-[140px]"
                />
                </TableCell>

                <TableCell className="text-right text-muted-foreground">
                —
                </TableCell>

                <TableCell>
                <div className="flex justify-end">
                    <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                        removerBloco(
                        bloco.key,
                        )
                    }
                    disabled={
                        isSubmitting
                    }
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remover lançamento"
                    >
                    <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                </TableCell>
            </TableRow>
            ),
        )}

        {/* Erro */}
        {submitError && (
            <TableRow>
            <TableCell
                colSpan={4}
                className="p-3"
            >
                <Alert variant="destructive">
                <AlertDescription>
                    {submitError}
                </AlertDescription>
                </Alert>
            </TableCell>
            </TableRow>
        )}

        {/* Ações */}
        <TableRow className="hover:bg-transparent">
            <TableCell
            colSpan={4}
            className="border-t-0 px-3 py-3"
            >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={
                    adicionarBloco
                }
                disabled={
                    isSubmitting ||
                    !podeAdicionarBloco
                }
                >
                <Plus className="h-4 w-4" />
                Adicionar fornecedor
                </Button>

                <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={
                    handleCancel
                    }
                    disabled={
                    isSubmitting
                    }
                >
                    Cancelar
                </Button>

                <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                    void handleConfirm()
                    }
                    disabled={
                    isSubmitting ||
                    blocosIncompletos
                    }
                >
                    {isSubmitting
                    ? "Salvando..."
                    : "Lançar orçamento"}
                </Button>
                </div>
            </div>
            </TableCell>
        </TableRow>
        </>
    );
    }