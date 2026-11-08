"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    FieldGroup,
    Field,
    FieldLabel,
} from "@/components/ui/field";
import { useSolicitarCancelamento } from "@/hooks/use-cancelamento";

interface CancelamentoOrdemModalProps {
    ordemId: string;
    tipoOrdem: "OF" | "OT";
}

export function CancelamentoOrdemModal({
    ordemId,
    tipoOrdem,
}: CancelamentoOrdemModalProps) {
    const { solicitar, isSoliciting } = useSolicitarCancelamento();

    const [open, setOpen] = useState(false);
    const [motivo, setMotivo] = useState("");
    const [necessidadePaciente, setNecessidadePaciente] = useState<
        "continua" | "encerrada"
    >("continua");
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleConfirm = async () => {
    if (!motivo.trim()) {
        setSubmitError("Informe o motivo do cancelamento.");
        return;
    }

    setSubmitError(null);

    try {
        await solicitar({
        ordem_fornecimento_id: tipoOrdem === "OF" ? ordemId : null,
        ordem_transporte_id: tipoOrdem === "OT" ? ordemId : null,
        motivo: motivo.trim(),
        necessidade_paciente: necessidadePaciente,
        });

        setMotivo("");
        setNecessidadePaciente("continua");
        setOpen(false);
    } catch (error) {
        setSubmitError(
        error instanceof Error
            ? error.message
            : "Erro ao solicitar o cancelamento.",
        );
    }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
            Solicitar cancelamento
            </Button>
        </DialogTrigger>

        <DialogContent>
            <DialogHeader>
            <DialogTitle>Solicitar cancelamento</DialogTitle>
            <DialogDescription>
                A solicitação será encaminhada aos gestores responsáveis.
                A ordem não será cancelada imediatamente.
            </DialogDescription>
            </DialogHeader>

            <FieldGroup>
            <Field>
                <FieldLabel htmlFor="motivo-cancelamento">
                Motivo do cancelamento
                </FieldLabel>
                <Textarea
                id="motivo-cancelamento"
                placeholder="Descreva o motivo da solicitação..."
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                rows={4}
                maxLength={2000}
                />
            </Field>

            <Field>
                <FieldLabel>Necessidade do paciente</FieldLabel>
                <Select
                value={necessidadePaciente}
                onValueChange={(value) =>
                    setNecessidadePaciente(value as "continua" | "encerrada")
                }
                >
                <SelectTrigger>
                    <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="continua">
                    Continua precisando do atendimento
                    </SelectItem>
                    <SelectItem value="encerrada">
                    Necessidade de atendimento encerrada
                    </SelectItem>
                </SelectContent>
                </Select>
            </Field>
            </FieldGroup>

            {submitError && (
            <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
            </Alert>
            )}

            <DialogFooter>
            <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSoliciting}
            >
                Voltar
            </Button>

            <Button
                variant="destructive"
                onClick={() => void handleConfirm()}
                disabled={!motivo.trim() || isSoliciting}
            >
                {isSoliciting ? "Enviando..." : "Enviar solicitação"}
            </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
    }