import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Não faz stale queries automaticamente ao mudar de abas
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 10, // 10 minutos (antes: cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: "stale",
      },
      mutations: {
        retry: 1,
      },
    },
  });
};

// Instância global do QueryClient
let queryClient: QueryClient | undefined;

export const getQueryClient = () => {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
};
