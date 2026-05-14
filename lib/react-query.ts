import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 10, // 10 minutos (antes: cacheTime)
        retry: 1,
        refetchOnWindowFocus: "always",
        refetchOnReconnect: "always",
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
