# React Query - Configuração e Documentação

## ✅ Instalação Concluída

O React Query (TanStack Query v5) foi instalado e configurado com sucesso no projeto.

## 📋 O que foi configurado

### 1. **Dependência instalada**

- `@tanstack/react-query@5.100.10`

### 2. **Arquivos criados**

- **[lib/react-query.ts](lib/react-query.ts)** - Configuração do QueryClient
  - Instância centralizada do QueryClient
  - Configurações padrão de cache e retry
  - staleTime: 5 minutos
  - gcTime: 10 minutos
  - retry: 1 tentativa

- **[components/providers/query-provider.tsx](components/providers/query-provider.tsx)** - Provider wrapper
  - Componente client-side que envolve a aplicação
  - Fornece QueryClientProvider a toda a hierarquia

- **[lib/react-query-examples.ts](lib/react-query-examples.ts)** - Exemplos de uso
  - Padrões de useQuery
  - Padrões de useMutation
  - Invalidação de queries
  - Customizações por query

### 3. **Modificações existentes**

- **[app/layout.tsx](app/layout.tsx)** - Integração do provider
  - QueryProvider envolve AuthProvider e DataProvider
  - Ordem: QueryProvider > AuthProvider > DataProvider > children

## 🚀 Como usar

### Exemplo básico com useQuery

```typescript
import { useQuery } from '@tanstack/react-query';

export function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pacientes'],
    queryFn: () => pacientesService.list(),
  });

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar</div>;

  return <div>{/* render data */}</div>;
}
```

### Exemplo com useMutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function CreateForm() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => pacientesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Criado com sucesso!');
    },
  });

  return <form onSubmit={(e) => {
    e.preventDefault();
    mutate(formData);
  }}>{/* form fields */}</form>;
}
```

## ⚙️ Configurações padrão

| Opção                  | Valor   | Descrição                                         |
| ---------------------- | ------- | ------------------------------------------------- |
| `staleTime`            | 5 min   | Tempo até dados serem considerados "velhos"       |
| `gcTime`               | 10 min  | Tempo de retenção em cache após não usados        |
| `retry`                | 1       | Número de tentativas em caso de erro              |
| `refetchOnWindowFocus` | false   | Não refaz busca ao voltar para aba                |
| `refetchOnReconnect`   | 'stale' | Refaz busca se dados estão "velhos" ao reconectar |

Para customizar uma query específica, passe as opções no `useQuery`:

```typescript
useQuery({
  queryKey: ["pacientes"],
  queryFn: () => pacientesService.list(),
  staleTime: 1000 * 60 * 30, // 30 minutos
  retry: 3,
});
```

## 📚 Recursos

- [Documentação oficial - React Query](https://tanstack.com/query/latest)
- [useQuery docs](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)
- [useMutation docs](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation)
- [useQueryClient docs](https://tanstack.com/query/latest/docs/framework/react/reference/useQueryClient)

## ✨ Próximas etapas (opcional)

1. **React Query Devtools** (para desenvolvimento)

   ```bash
   pnpm add -D @tanstack/react-query-devtools
   ```

2. **Integrar com services existentes**
   - Atualizar pacientes-service.ts, produtos-service.ts, etc.
   - Usar useQuery/useMutation nos componentes

3. **Adicionar persistência (opcional)**
   ```bash
   pnpm add @tanstack/react-query-persist-client
   ```

---

**Status:** ✅ Configuração completa e pronta para uso
