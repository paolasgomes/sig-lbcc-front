
import { useQuery } from "@tanstack/react-query";
import { buscarRelatorioPorPeriodo } from "@/services/relatorios-service";

export function useRelatorioPorPeriodo(
    dataInicio: string,
    dataFim: string,
    ) {
    return useQuery({
        queryKey: ["relatorio-periodo", dataInicio, dataFim],
        queryFn: () => buscarRelatorioPorPeriodo(dataInicio, dataFim),
        enabled: Boolean(dataInicio && dataFim && dataInicio <= dataFim),
        staleTime: 1000 * 60 * 5,
    });
    }
