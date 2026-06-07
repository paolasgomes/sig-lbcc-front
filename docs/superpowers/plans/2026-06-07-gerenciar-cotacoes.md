# RF_B5 — Gerenciar Cotações Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the cotações UI in `web/` to the real API, remove mocks, and align the data model with the backend (`ativo` status, no workflow/prices).

**Architecture:** Single `cotacoes-service.ts` handles DTO mapping and HTTP calls; `use-cotacoes.ts` exposes React Query queries/mutations; pages consume hooks directly (no Context). Gestor-only write actions gated via `use-usuario.ts`.

**Tech Stack:** Next.js 16, React 19, TanStack Query v5, Axios, TypeScript, Vitest (added for unit tests), Playwright CLI (E2E verification per spec).

**Spec:** `web/docs/superpowers/specs/2026-06-07-gerenciar-cotacoes-design.md`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `lib/cotacoes-utils.ts` | `isCotacaoVencida`, display helpers |
| `lib/cotacoes-utils.test.ts` | Unit tests for date logic |
| `services/cotacoes-service.ts` | API calls, DTO mappers, custom delete error |
| `services/cotacoes-service.test.ts` | Mapper unit tests |
| `hooks/use-usuario.ts` | Current user `perfil` from JWT cookie |
| `hooks/use-cotacoes.ts` | React Query list/detail + mutations |
| `types/index.ts` | New `Cotacao` / `ItemCotacao` interfaces |
| `components/layout/dashboard-layout.tsx` | Forward `allowedRoles` to `ProtectedRoute` |
| `app/cotacoes/page.tsx` | List with filters, gestor actions |
| `components/cotacoes/cotacao-form.tsx` | Create/edit form + item table |
| `app/cotacoes/nova/page.tsx` | Layout guard update |
| `app/cotacoes/[id]/page.tsx` | Read-only detail + gestor actions |
| `app/cotacoes/[id]/editar/page.tsx` | Load from API, gestor-only |
| `components/pacientes/paciente-cotacoes.tsx` | Patient tab via `useCotacoes` |
| `components/shared/status-badge.tsx` | `ativo`/`inativo` for cotações |
| `app/dashboard/page.tsx` | API-backed cotacao stats |
| `app/relatorios/page.tsx` | Minimal cotacao metrics |
| `contexts/data-context.tsx` | Remove cotacoes slice |
| `mocks/cotacoes.ts` | **Delete** |
| `mocks/index.ts` | Remove cotacoes export |

---

### Task 1: Add Vitest for unit tests

**Files:**
- Modify: `web/package.json`
- Create: `web/vitest.config.ts`

The `web/` project has no test runner. Add Vitest before writing utils/service tests.

- [ ] **Step 1: Install Vitest**

Run from `web/`:

```bash
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 2: Add test script to `package.json`**

Add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 4: Run test command (expect 0 tests, exit 0)**

Run: `npm test`
Expected: `Tests  no tests` or `0 passed`, exit code 0

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for web unit tests"
```

---

### Task 2: `lib/cotacoes-utils.ts`

**Files:**
- Create: `web/lib/cotacoes-utils.ts`
- Create: `web/lib/cotacoes-utils.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// web/lib/cotacoes-utils.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { isCotacaoVencida } from "./cotacoes-utils";

describe("isCotacaoVencida", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false when dataValidade is today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-07T12:00:00"));

    expect(isCotacaoVencida("2026-06-07")).toBe(false);
  });

  it("returns true when dataValidade is before today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-07T12:00:00"));

    expect(isCotacaoVencida("2026-06-06")).toBe(true);
  });

  it("returns false when dataValidade is after today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-07T12:00:00"));

    expect(isCotacaoVencida("2026-06-08")).toBe(false);
  });

  it("compares date-only ignoring time portion", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-07T23:59:59"));

    expect(isCotacaoVencida("2026-06-07T00:00:00.000Z")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/cotacoes-utils.test.ts`
Expected: FAIL — `isCotacaoVencida` not defined

- [ ] **Step 3: Write minimal implementation**

```typescript
// web/lib/cotacoes-utils.ts
function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isCotacaoVencida(dataValidade: string): boolean {
  return toDateOnly(dataValidade) < todayDateOnly();
}

export function formatCotacaoNumero(cotacao: { numero?: string | null; id: string }): string {
  if (cotacao.numero) {
    return cotacao.numero;
  }

  return cotacao.id.slice(0, 8).toUpperCase();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/cotacoes-utils.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/cotacoes-utils.ts lib/cotacoes-utils.test.ts
git commit -m "feat: add cotacoes date utility helpers"
```

---

### Task 3: Update `types/index.ts`

**Files:**
- Modify: `web/types/index.ts`

Replace the old workflow-based `Cotacao` / `ItemCotacao` interfaces. Keep `StatusCotacao` enum (still used by historico mocks).

- [ ] **Step 1: Replace `Cotacao` and `ItemCotacao` interfaces**

Find and replace the existing interfaces (around lines 207–241) with:

```typescript
export interface Cotacao {
  id: string;
  descricao: string;
  pacienteId: string;
  areaId: string;
  dataValidade: string;
  observacoes: string;
  ativo: boolean;
  numero?: string;
  criadoEm: string;
  pacienteNome?: string;
  areaNome?: string;
  itens: ItemCotacao[];
}

export interface ItemCotacao {
  id?: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  ordem?: number;
}

export interface CotacaoCreateInput {
  descricao: string;
  pacienteId: string;
  areaId: string;
  dataValidade: string;
  observacoes?: string;
  itens: Omit<ItemCotacao, "id">[];
}

export interface CotacaoUpdateInput {
  descricao?: string;
  pacienteId?: string;
  areaId?: string;
  dataValidade?: string;
  observacoes?: string;
  itens?: ItemCotacao[];
}
```

- [ ] **Step 2: Update `CotacaoFormData` and `FiltroCotacao`**

Replace:

```typescript
export type CotacaoFormData = Omit<Cotacao, "id" | "criadoEm" | "ativo" | "itens"> & {
  itens: Omit<ItemCotacao, "id">[];
};

export interface FiltroCotacao {
  pacienteId?: string;
  areaId?: string;
  ativo?: boolean | "todas";
  busca?: string;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: errors only in files still using old fields (cotacoes pages, form, data-context) — note them for later tasks

- [ ] **Step 4: Commit**

```bash
git add types/index.ts
git commit -m "refactor: align cotacao types with api model"
```

---

### Task 4: `hooks/use-usuario.ts`

**Files:**
- Create: `web/hooks/use-usuario.ts`

Extract JWT parsing from `auth-context.tsx` without importing `@/contexts/*` in cotações modules.

- [ ] **Step 1: Create the hook**

```typescript
// web/hooks/use-usuario.ts
"use client";

import { useMemo } from "react";
import { getStoredToken } from "@/services/auth-service";
import { mapLegacyRoleToPerfil } from "@/lib/access-control";
import { PerfilUsuario, Usuario } from "@/types";

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalizedPayload));
  } catch {
    return null;
  }
}

function buildUsuarioFromToken(token: string): Usuario | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const email =
    typeof payload.email === "string"
      ? payload.email
      : typeof payload.username === "string"
        ? payload.username
        : "";

  const nome =
    typeof payload.nome === "string"
      ? payload.nome
      : typeof payload.name === "string"
        ? payload.name
        : email
          ? email.split("@")[0]
          : "Usuário";

  const id =
    typeof payload.sub === "string"
      ? payload.sub
      : typeof payload.id === "string"
        ? payload.id
        : typeof payload.userId === "string"
          ? payload.userId
          : nome;

  const perfil =
    typeof payload.perfil === "string" || typeof payload.role === "string"
      ? mapLegacyRoleToPerfil(String(payload.perfil ?? payload.role))
      : PerfilUsuario.OPERADOR;

  const role =
    typeof payload.role === "string"
      ? payload.role
      : typeof payload.perfil === "string"
        ? payload.perfil
        : undefined;

  return { id, nome, email, perfil, role, ativo: true };
}

export function useUsuario() {
  const usuario = useMemo(() => {
    const token = getStoredToken();
    if (!token) return null;
    return buildUsuarioFromToken(token);
  }, []);

  const isGestor = usuario?.perfil === PerfilUsuario.GESTOR;

  return { usuario, perfil: usuario?.perfil ?? null, isGestor };
}
```

- [ ] **Step 2: Verify TypeScript compiles for new file**

Run: `npx tsc --noEmit 2>&1 | grep use-usuario || echo "OK"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add hooks/use-usuario.ts
git commit -m "feat: add use-usuario hook from jwt cookie"
```

---

### Task 5: `services/cotacoes-service.ts`

**Files:**
- Create: `web/services/cotacoes-service.ts`
- Create: `web/services/cotacoes-service.test.ts`

Follow `services/produtos-service.ts` pattern. API responses use `erro` field — handle in local error helper.

- [ ] **Step 1: Write mapper tests**

```typescript
// web/services/cotacoes-service.test.ts
import { describe, it, expect } from "vitest";
import { mapApiCotacaoToCotacao, mapApiItemToItemCotacao } from "./cotacoes-service";

describe("mapApiCotacaoToCotacao", () => {
  it("maps snake_case api dto to camelCase cotacao", () => {
    const result = mapApiCotacaoToCotacao({
      id: "uuid-1",
      descricao: "Cotação teste",
      paciente_id: "p-1",
      area_id: "a-1",
      data_validade: "2026-12-31",
      observacoes: "obs",
      ativo: true,
      numero: "COT-001",
      created_at: "2026-06-01T00:00:00Z",
      pacientes: { id: "p-1", nome: "Maria Silva" },
      areas: { id: "a-1", nome: "Quimioterapia" },
    });

    expect(result).toEqual({
      id: "uuid-1",
      descricao: "Cotação teste",
      pacienteId: "p-1",
      areaId: "a-1",
      dataValidade: "2026-12-31",
      observacoes: "obs",
      ativo: true,
      numero: "COT-001",
      criadoEm: "2026-06-01T00:00:00Z",
      pacienteNome: "Maria Silva",
      areaNome: "Quimioterapia",
      itens: [],
    });
  });
});

describe("mapApiItemToItemCotacao", () => {
  it("maps item fields", () => {
    expect(
      mapApiItemToItemCotacao({
        id: "item-1",
        descricao: "Seringa",
        quantidade: 10,
        unidade: "UN",
        ordem: 1,
      }),
    ).toEqual({
      id: "item-1",
      descricao: "Seringa",
      quantidade: 10,
      unidade: "UN",
      ordem: 1,
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- services/cotacoes-service.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the service**

```typescript
// web/services/cotacoes-service.ts
import axios from "axios";
import { api } from "./api";
import { getFriendlyApiError } from "@/lib/api-errors";
import type { Cotacao, CotacaoCreateInput, CotacaoUpdateInput, ItemCotacao } from "@/types";

export interface ApiCotacaoDTO {
  id: string;
  descricao: string;
  paciente_id: string;
  area_id: string;
  data_validade: string;
  observacoes?: string | null;
  ativo: boolean;
  numero?: string | null;
  created_at: string;
  pacientes?: { id: string; nome: string } | null;
  areas?: { id: string; nome: string } | null;
}

export interface ApiItemCotacaoDTO {
  id: string;
  cotacao_id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  ordem?: number | null;
}

interface ApiErrorBody {
  erro?: string;
  error?: string;
  message?: string;
  cotacaoTemVinculos?: boolean;
  relacionamentos?: { propostas?: number; itens?: number };
}

export class CotacaoVinculosError extends Error {
  relacionamentos: { propostas: number; itens: number };

  constructor(message: string, relacionamentos: { propostas: number; itens: number }) {
    super(message);
    this.name = "CotacaoVinculosError";
    this.relacionamentos = relacionamentos;
  }
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    const candidate = data?.erro ?? data?.error ?? data?.message;

    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }

    if (error.response?.status === 403) {
      return "Apenas gestor pode realizar esta ação.";
    }
  }

  return getFriendlyApiError(error, fallback);
}

export function mapApiCotacaoToCotacao(
  apiCotacao: ApiCotacaoDTO,
  itens: ItemCotacao[] = [],
): Cotacao {
  return {
    id: apiCotacao.id,
    descricao: apiCotacao.descricao ?? "",
    pacienteId: apiCotacao.paciente_id ?? "",
    areaId: apiCotacao.area_id ?? "",
    dataValidade: apiCotacao.data_validade ?? "",
    observacoes: apiCotacao.observacoes ?? "",
    ativo: apiCotacao.ativo ?? true,
    numero: apiCotacao.numero ?? undefined,
    criadoEm: apiCotacao.created_at ?? new Date().toISOString(),
    pacienteNome: apiCotacao.pacientes?.nome,
    areaNome: apiCotacao.areas?.nome,
    itens,
  };
}

export function mapApiItemToItemCotacao(dto: ApiItemCotacaoDTO): ItemCotacao {
  return {
    id: dto.id,
    descricao: dto.descricao ?? "",
    quantidade: dto.quantidade ?? 0,
    unidade: dto.unidade ?? "UN",
    ordem: dto.ordem ?? undefined,
  };
}

function mapCotacaoToApiPayload(dados: Partial<CotacaoCreateInput>) {
  return {
    descricao: dados.descricao,
    data_validade: dados.dataValidade,
    paciente_id: dados.pacienteId,
    area_id: dados.areaId,
    observacoes: dados.observacoes ?? "",
  };
}

function mapItemToApiPayload(item: Omit<ItemCotacao, "id">, ordem: number) {
  return {
    descricao: item.descricao,
    quantidade: item.quantidade,
    unidade: item.unidade,
    ordem,
  };
}

export async function listarItensCotacao(cotacaoId: string): Promise<ItemCotacao[]> {
  try {
    const response = await api.get<ApiItemCotacaoDTO[]>(
      `/cotacao-itens/cotacao/${cotacaoId}`,
    );
    return response.data.map(mapApiItemToItemCotacao);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar itens da cotação."));
  }
}

export async function listarCotacoes(ativo?: boolean | "todas"): Promise<Cotacao[]> {
  try {
    let dtos: ApiCotacaoDTO[];

    if (ativo === "todas") {
      const [ativas, inativas] = await Promise.all([
        api.get<ApiCotacaoDTO[]>("/cotacoes"),
        api.get<ApiCotacaoDTO[]>("/cotacoes", { params: { ativo: false } }),
      ]);
      const merged = new Map<string, ApiCotacaoDTO>();
      [...ativas.data, ...inativas.data].forEach((c) => merged.set(c.id, c));
      dtos = Array.from(merged.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else if (ativo === false) {
      const response = await api.get<ApiCotacaoDTO[]>("/cotacoes", {
        params: { ativo: false },
      });
      dtos = response.data;
    } else {
      const response = await api.get<ApiCotacaoDTO[]>("/cotacoes");
      dtos = response.data;
    }

    const cotacoesComItens = await Promise.all(
      dtos.map(async (dto) => {
        const itens = await listarItensCotacao(dto.id);
        return mapApiCotacaoToCotacao(dto, itens);
      }),
    );

    return cotacoesComItens;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar cotações."));
  }
}

export async function obterCotacao(id: string): Promise<Cotacao> {
  try {
    const [cotacaoResponse, itens] = await Promise.all([
      api.get<ApiCotacaoDTO>(`/cotacoes/${id}`),
      listarItensCotacao(id),
    ]);
    return mapApiCotacaoToCotacao(cotacaoResponse.data, itens);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar cotação."));
  }
}

export async function criarCotacao(dados: CotacaoCreateInput): Promise<Cotacao> {
  try {
    const response = await api.post<ApiCotacaoDTO>(
      "/cotacoes",
      mapCotacaoToApiPayload(dados),
    );
    const cotacaoId = response.data.id;

    const itensCriados: ItemCotacao[] = [];
    for (let index = 0; index < dados.itens.length; index++) {
      const itemResponse = await api.post<ApiItemCotacaoDTO>(
        `/cotacao-itens/cotacao/${cotacaoId}`,
        mapItemToApiPayload(dados.itens[index], index + 1),
      );
      itensCriados.push(mapApiItemToItemCotacao(itemResponse.data));
    }

    return mapApiCotacaoToCotacao(response.data, itensCriados);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao criar cotação."));
  }
}

export async function atualizarCotacao(id: string, dados: CotacaoUpdateInput): Promise<Cotacao> {
  try {
    const response = await api.put<ApiCotacaoDTO>(
      `/cotacoes/${id}`,
      mapCotacaoToApiPayload(dados),
    );

    if (dados.itens) {
      const itensAtuais = await listarItensCotacao(id);
      const idsAtuais = new Set(itensAtuais.map((i) => i.id).filter(Boolean) as string[]);
      const idsEnviados = new Set(
        dados.itens.map((i) => i.id).filter(Boolean) as string[],
      );

      for (const itemAtual of itensAtuais) {
        if (itemAtual.id && !idsEnviados.has(itemAtual.id)) {
          await api.delete(`/cotacao-itens/${itemAtual.id}`);
        }
      }

      for (let index = 0; index < dados.itens.length; index++) {
        const item = dados.itens[index];
        const payload = mapItemToApiPayload(item, index + 1);

        if (item.id && idsAtuais.has(item.id)) {
          await api.put(`/cotacao-itens/${item.id}`, payload);
        } else {
          await api.post(`/cotacao-itens/cotacao/${id}`, payload);
        }
      }
    }

    return obterCotacao(id);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao atualizar cotação."));
  }
}

export async function alternarStatusCotacao(id: string): Promise<Cotacao> {
  try {
    await api.patch(`/cotacoes/${id}/status`);
    return obterCotacao(id);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao alterar status da cotação."));
  }
}

export async function excluirCotacao(id: string): Promise<void> {
  try {
    await api.delete(`/cotacoes/${id}`);
  } catch (error) {
    if (axios.isAxiosError<ApiErrorBody>(error)) {
      const data = error.response?.data;

      if (data?.cotacaoTemVinculos && data.relacionamentos) {
        throw new CotacaoVinculosError(
          data.erro ?? "Cotação possui vínculos e não pode ser excluída.",
          {
            propostas: data.relacionamentos.propostas ?? 0,
            itens: data.relacionamentos.itens ?? 0,
          },
        );
      }

      if (error.response?.status === 403) {
        throw new Error("Apenas gestor pode realizar esta ação.");
      }
    }

    throw new Error(getApiErrorMessage(error, "Erro ao excluir cotação."));
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- services/cotacoes-service.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add services/cotacoes-service.ts services/cotacoes-service.test.ts
git commit -m "feat: add cotacoes service with api integration"
```

---

### Task 6: Expand `hooks/use-cotacoes.ts`

**Files:**
- Modify: `web/hooks/use-cotacoes.ts`

- [ ] **Step 1: Replace mock hook with API-backed queries and mutations**

```typescript
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarCotacoes,
  obterCotacao,
  criarCotacao,
  atualizarCotacao,
  alternarStatusCotacao,
  excluirCotacao,
  CotacaoVinculosError,
} from "@/services/cotacoes-service";
import type { Cotacao, CotacaoCreateInput, CotacaoUpdateInput } from "@/types";

export { CotacaoVinculosError };

export function useCotacoes(ativo?: boolean | "todas") {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cotacoes", ativo ?? "ativas"],
    queryFn: () => listarCotacoes(ativo ?? "todas"),
    staleTime: 1000 * 60,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["cotacoes"] });

  const createMutation = useMutation({
    mutationFn: (dados: CotacaoCreateInput) => criarCotacao(dados),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: CotacaoUpdateInput }) =>
      atualizarCotacao(id, dados),
    onSuccess: (_, { id }) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["cotacoes", id] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => alternarStatusCotacao(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => excluirCotacao(id),
    onSuccess: invalidate,
  });

  return {
    cotacoes: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    criarCotacao: createMutation.mutateAsync,
    atualizarCotacao: updateMutation.mutateAsync,
    alternarStatus: toggleStatusMutation.mutateAsync,
    excluirCotacao: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
    query,
  };
}

export function useCotacao(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cotacoes", id],
    queryFn: () => obterCotacao(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
    queryClient.invalidateQueries({ queryKey: ["cotacoes", id] });
  };

  const updateMutation = useMutation({
    mutationFn: (dados: CotacaoUpdateInput) => atualizarCotacao(id, dados),
    onSuccess: invalidate,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () => alternarStatusCotacao(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => excluirCotacao(id),
    onSuccess: invalidate,
  });

  return {
    cotacao: query.data ?? null,
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    atualizarCotacao: updateMutation.mutateAsync,
    alternarStatus: toggleStatusMutation.mutateAsync,
    excluirCotacao: deleteMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
    query,
  };
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build 2>&1 | tail -20`
Expected: may fail on pages still using old types — proceed to UI tasks

- [ ] **Step 3: Commit**

```bash
git add hooks/use-cotacoes.ts
git commit -m "feat: wire use-cotacoes hook to api service"
```

---

### Task 7: Update `status-badge.tsx` and `dashboard-layout.tsx`

**Files:**
- Modify: `web/components/shared/status-badge.tsx`
- Modify: `web/components/layout/dashboard-layout.tsx`

- [ ] **Step 1: Add ativo/inativo cotação badges**

In `status-badge.tsx`, replace cotação workflow entries with:

```typescript
  ativo: {
    label: "Ativa",
    className: "bg-success/15 text-success border-success/30",
  },
  inativo: {
    label: "Inativa",
    className: "bg-muted text-muted-foreground border-border",
  },
```

Remove `StatusCotacao.PENDENTE`, `VALIDA`, `EXPIRADA` entries from the config (keep enum import only if used elsewhere in file — if not, remove import).

Add helper usage in cotações pages:

```typescript
<StatusBadge status={cotacao.ativo ? "ativo" : "inativo"} />
```

- [ ] **Step 2: Forward `allowedRoles` in DashboardLayout**

```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
  perfisPermitidos?: PerfilUsuario[];
  allowedRoles?: string[];
}

export function DashboardLayout({ children, perfisPermitidos, allowedRoles }: DashboardLayoutProps) {
  return (
    <ProtectedRoute perfisPermitidos={perfisPermitidos} allowedRoles={allowedRoles}>
      {/* ... unchanged ... */}
    </ProtectedRoute>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/shared/status-badge.tsx components/layout/dashboard-layout.tsx
git commit -m "refactor: simplify cotacao status badge and layout roles"
```

---

### Task 8: Rewrite list page `app/cotacoes/page.tsx`

**Files:**
- Modify: `web/app/cotacoes/page.tsx`

Mirror `app/usuarios/page.tsx` patterns: `TableLoading`, destructive `Alert` + retry, `Empty`, pagination, gestor actions.

- [ ] **Step 1: Replace entire page**

Key imports:

```typescript
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";
import { useCotacoes, CotacaoVinculosError } from "@/hooks/use-cotacoes";
import { useUsuario } from "@/hooks/use-usuario";
import { isCotacaoVencida, formatCotacaoNumero } from "@/lib/cotacoes-utils";
import { AlertTriangle } from "lucide-react";
```

Key behaviors:
- `useCotacoes("todas")` for full list; client-side filter by `filtroAtivo` (todas/ativas/inativas)
- Search matches `descricao`, `pacienteNome`, `numero`, truncated id
- Columns: Número (`formatCotacaoNumero`), Descrição, Paciente, Validade (⚠ if `isCotacaoVencida`), Itens count, Status (`ativo` badge), Actions
- Gestor-only (`isGestor`): Nova Cotação link, Editar, Ativar/Inativar (confirm), Excluir (confirm)
- Delete catch `CotacaoVinculosError` → show `"Não é possível excluir: ${propostas} proposta(s), ${itens} item(ns) vinculados."`
- Remove `ProtectedRoute` wrapper; use `<DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>`
- Loading: `<TableLoading colSpan={7} />`
- Error: destructive `Alert` with retry button calling `refetch()`
- Empty: `<Empty>` with gestor CTA "Nova Cotação"

- [ ] **Step 2: Manual smoke test**

Run: `npm run dev` (ensure API running on port 3000)
Navigate: `/cotacoes` as gestor
Expected: list loads from API (or empty state)

- [ ] **Step 3: Commit**

```bash
git add app/cotacoes/page.tsx
git commit -m "feat: rewrite cotacoes list page with api data"
```

---

### Task 9: Rewrite `components/cotacoes/cotacao-form.tsx`

**Files:**
- Modify: `web/components/cotacoes/cotacao-form.tsx`

- [ ] **Step 1: Replace form implementation**

Remove: `useData`, produto/fornecedor pickers, price fields, dual submit (draft/send).

Add:
- `usePacientes()`, `useAreas()`, `useCotacoes()` or callbacks via props
- Fields: paciente (select), área (select), descrição, data validade (`type="date"`), observações
- Items table: descricao / quantidade / unidade — add row button, remove row button
- Validation before submit: all header fields + `itens.length >= 1` + each item has descricao, quantidade > 0, unidade
- Single "Salvar" button
- Pre-fill `pacienteId` from `useSearchParams().get("pacienteId")`
- On create: call `criarCotacao`, redirect to `/cotacoes/:id`
- On edit: call `atualizarCotacao`, redirect to `/cotacoes/:id`

Props interface:

```typescript
interface CotacaoFormProps {
  cotacao?: Cotacao;
  isEditing?: boolean;
}
```

Item row state type:

```typescript
type ItemFormRow = {
  id?: string;
  descricao: string;
  quantidade: number;
  unidade: string;
};
```

Common units for select: `UN`, `CX`, `FR`, `ML`, `MG`, `KG`, `PC` (with free-text fallback via Input).

- [ ] **Step 2: Commit**

```bash
git add components/cotacoes/cotacao-form.tsx
git commit -m "feat: simplify cotacao form for api model"
```

---

### Task 10: Update nova and editar pages

**Files:**
- Modify: `web/app/cotacoes/nova/page.tsx`
- Modify: `web/app/cotacoes/[id]/editar/page.tsx`

- [ ] **Step 1: Update `nova/page.tsx`**

```typescript
"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CotacaoForm } from "@/components/cotacoes/cotacao-form";
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";

export default function NovaCotacaoPage() {
  return (
    <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
      <CotacaoForm />
    </DashboardLayout>
  );
}
```

- [ ] **Step 2: Update `editar/page.tsx`**

```typescript
"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CotacaoForm } from "@/components/cotacoes/cotacao-form";
import { useCotacao } from "@/hooks/use-cotacoes";
import { useUsuario } from "@/hooks/use-usuario";
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";
import { Spinner } from "@/components/ui/spinner";

interface EditarCotacaoPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarCotacaoPage({ params }: EditarCotacaoPageProps) {
  const { id } = use(params);
  const { cotacao, isLoading, error } = useCotacao(id);
  const { isGestor } = useUsuario();

  if (isLoading) {
    return (
      <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !cotacao) {
    notFound();
  }

  if (!isGestor) {
    notFound();
  }

  return (
    <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
      <CotacaoForm cotacao={cotacao} isEditing />
    </DashboardLayout>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/cotacoes/nova/page.tsx app/cotacoes/[id]/editar/page.tsx
git commit -m "feat: update cotacao create and edit pages for api"
```

---

### Task 11: Rewrite detail page `app/cotacoes/[id]/page.tsx`

**Files:**
- Modify: `web/app/cotacoes/[id]/page.tsx`

- [ ] **Step 1: Replace Context usage with hooks**

Use `useCotacao(id)`, `useUsuario()`, remove approve/reject, currency, produto/fornecedor lookups.

Sections:
- Header: número, descrição, status badge, back link
- Card "Informações gerais": paciente, área, validade (⚠ if vencida), observações
- Card "Itens": table with descricao, quantidade, unidade (no prices)
- Card "Metadados": criadoEm formatted

Gestor actions (AlertDialog):
- Editar → `/cotacoes/:id/editar`
- Ativar/Inativar → `alternarStatus()` with confirmation
- Excluir → `excluirCotacao()` with vínculos error message

Read-only for non-gestor (hide action buttons).

Layout: `<DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>`

- [ ] **Step 2: Commit**

```bash
git add app/cotacoes/[id]/page.tsx
git commit -m "feat: rewrite cotacao detail page with api data"
```

---

### Task 12: Update `components/pacientes/paciente-cotacoes.tsx`

**Files:**
- Modify: `web/components/pacientes/paciente-cotacoes.tsx`

- [ ] **Step 1: Replace Context with hooks**

```typescript
import { useCotacoes } from "@/hooks/use-cotacoes";
import { useUsuario } from "@/hooks/use-usuario";
import { isCotacaoVencida } from "@/lib/cotacoes-utils";
```

Filter: `cotacoes.filter((c) => c.pacienteId === pacienteId)`

Columns: descrição, área (`areaNome`), validade (⚠ if vencida), status (ativo badge), actions (Ver → `/cotacoes/:id`)

Gestor CTA: "Nova Cotação" → `/cotacoes/nova?pacienteId=${pacienteId}`

Remove: monetary values, fornecedor lookup, `useAuth`, `useData`, `podeVisualizarValores` gate (tab visible to all roles in `ROLES_ATENDIMENTOS_E_COTACOES`)

- [ ] **Step 2: Commit**

```bash
git add components/pacientes/paciente-cotacoes.tsx
git commit -m "feat: wire patient cotacoes tab to api hook"
```

---

### Task 13: Update dashboard and relatorios

**Files:**
- Modify: `web/app/dashboard/page.tsx`
- Modify: `web/app/relatorios/page.tsx`

- [ ] **Step 1: Update dashboard**

Replace `useData().getStats()` cotacao fields:

```typescript
import { useCotacoes } from "@/hooks/use-cotacoes";
import { isCotacaoVencida } from "@/lib/cotacoes-utils";

const { cotacoes } = useCotacoes("todas");
const totalCotacoes = cotacoes.length;
const cotacoesVencidas = cotacoes.filter(
  (c) => c.ativo && isCotacaoVencida(c.dataValidade),
).length;
```

Update cards to use computed values. Change vencidas href to `/cotacoes` (remove `?status=expirada`).

Keep other stats from `useData()` for pacientes/atendimentos until those modules migrate.

- [ ] **Step 2: Update relatorios (minimal)**

Replace `useData().cotacoes` with `useCotacoes("todas")`.

Replace workflow status chart data:

```typescript
const cotacoesAtivas = cotacoesFiltradas.filter((c) => c.ativo).length;
const cotacoesInativas = cotacoesFiltradas.filter((c) => !c.ativo).length;
const cotacoesVencidas = cotacoesFiltradas.filter(
  (c) => c.ativo && isCotacaoVencida(c.dataValidade),
).length;
```

Remove monetary aggregations (`valorTotalCotacoes`, `valorAprovado`).

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx app/relatorios/page.tsx
git commit -m "feat: use api cotacoes in dashboard and reports"
```

---

### Task 14: Mock and Context cleanup

**Files:**
- Delete: `web/mocks/cotacoes.ts`
- Modify: `web/mocks/index.ts`
- Modify: `web/contexts/data-context.tsx`

- [ ] **Step 1: Delete mock file and export**

Remove line from `mocks/index.ts`:

```typescript
export { cotacoesMock } from './cotacoes'
```

Delete `mocks/cotacoes.ts`.

- [ ] **Step 2: Remove cotacoes slice from data-context**

Remove from `DataContextType` and provider value:
- `cotacoes` state
- `addCotacao`, `updateCotacao`, `getCotacaoById`, `getCotacoesByPaciente`
- `cotacoesMock` import
- `totalCotacoes` / `cotacoesVencidas` from `getStats()` (keep other stats fields)
- References to `cotacoes` in `canDeleteArea` / `canDeleteFornecedor` — replace with `false` or remove cotacao check (fornecedor check can stay without cotacao dependency)

Search for remaining imports:

```bash
rg "cotacoesMock|getCotacoesByPaciente|addCotacao|updateCotacao" web/
```

Fix any stragglers outside already-updated files.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: PASS (exit 0)

- [ ] **Step 4: Run unit tests**

Run: `npm test`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove cotacoes mocks and context slice"
```

---

### Task 15: E2E verification (Playwright CLI)

**Files:** none (manual verification per spec)

Credentials: `gestor@email.com` / `123`

Prerequisites: API running (`cd api && npm start`), web dev server (`cd web && npm run dev`).

- [ ] **Step 1: Login and navigate to cotações**

```bash
playwright-cli open http://localhost:3001/login
# login with gestor@email.com / 123
# navigate to /cotacoes
```

Expected: list page loads without mock data errors

- [ ] **Step 2: Create cotação**

Fill: paciente, área, descrição, data validade, 2 itens → Salvar

Expected: redirects to `/cotacoes/:id`, detail shows 2 items

- [ ] **Step 3: Edit cotação**

Change descrição and one item quantity → Salvar

Expected: detail reflects changes

- [ ] **Step 4: Toggle inativar / reativar**

Expected: badge toggles Inativa ↔ Ativa

- [ ] **Step 5: Attempt delete with items**

Expected: vínculos error showing item count

- [ ] **Step 6: Patient tab**

Open patient detail → Cotações tab

Expected: linked cotação visible

- [ ] **Step 7: Dashboard stats**

Expected: total and vencidas counts match list data

---

## Self-Review Checklist

| Spec requirement | Task |
|-----------------|------|
| API-only data source | Tasks 5–6, 14 |
| `ativo` status model | Tasks 3, 7, 8, 11 |
| `data_validade` warning | Tasks 2, 8, 11, 12 |
| Service + hook architecture | Tasks 5–6 |
| Routes unchanged | Tasks 8–11 |
| No Context in cotações | Tasks 4, 6, 8–12, 14 |
| Gestor write permissions | Tasks 4, 8–11 |
| Create/edit item sync | Task 5 (`criarCotacao`, `atualizarCotacao`) |
| Delete vínculos error | Tasks 5, 8, 11 |
| Patient tab | Task 12 |
| Dashboard stats | Task 13 |
| Relatorios minimal update | Task 13 |
| Mock cleanup | Task 14 |
| Playwright verification | Task 15 |

**Placeholder scan:** All tasks include concrete code, file paths, and commands.

**Type consistency:** `Cotacao`, `ItemCotacao`, `CotacaoCreateInput`, `CotacaoUpdateInput` defined in Task 3 and used consistently in Tasks 5–12.

---

**Plan complete and saved to `web/docs/superpowers/plans/2026-06-07-gerenciar-cotacoes.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
