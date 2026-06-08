# RF_B3 — Gerenciar Fornecedores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the fornecedores UI in `web/` to the real API (`/fornecedores`), remove mocks and Context usage, simplify the data model to six contract fields, and apply minimal API adjustments so the list returns active + inactive suppliers.

**Architecture:** `fornecedores-service.ts` handles DTO mapping and HTTP calls; `use-fornecedores.ts` exposes React Query list/detail queries and mutations (mirroring Usuários/Pacientes); pages consume hooks directly. Primary lifecycle is inactivate/reactivate via `PATCH /status`; hard delete only when `fornecedorTemVinculos === false`.

**Tech Stack:** Express + Supabase (`api/`), Next.js 16 + React 19 + TanStack Query v5 + Axios + TypeScript + Vitest (`web/`), Jest + Supertest (`api/`).

**Spec:** `web/docs/superpowers/specs/2026-06-08-gerenciar-fornecedores-design.md`

**Test user:** `gestor@email.com` / `123`

**Note:** `api/` and `web/` are separate git repos — commit in each independently.

---

## File Structure

### API — modify

| File | Responsibility |
|------|----------------|
| `api/src/modules/fornecedores/services/fornecedores.service.js` | List all suppliers (remove `ativo` filter) |
| `api/src/modules/fornecedores/controllers/fornecedores.controller.js` | Whitelist create fields |
| `api/tests/fornecedores.test.js` | Fix comments + status toggle + inactive-in-list tests |

### Web — modify / create / delete

| File | Responsibility |
|------|----------------|
| `web/types/index.ts` | Simplified `Fornecedor`, `ApiFornecedorDTO`, input types |
| `web/services/fornecedores-service.ts` | Full CRUD + mappers |
| `web/services/fornecedores-service.test.ts` | Mapper unit tests |
| `web/hooks/use-fornecedores.ts` | List mutations + `useFornecedor(id)` |
| `web/app/fornecedores/page.tsx` | API-backed list (Usuários/Produtos patterns) |
| `web/components/fornecedores/fornecedor-form.tsx` | Simplified 6-field form |
| `web/app/fornecedores/[id]/page.tsx` | Detail via `useFornecedor` |
| `web/app/fornecedores/[id]/editar/page.tsx` | Edit load via `useFornecedor` |
| `web/app/fornecedores/novo/page.tsx` | Layout guard via `DashboardLayout` |
| `web/components/cotacoes/cotacao-form.tsx` | Remove `f.nome` fallback (type cleanup) |
| `web/contexts/data-context.tsx` | Remove fornecedores slice |
| `web/mocks/fornecedores.ts` | **Delete** |
| `web/mocks/index.ts` | Remove export |
| `web/mocks/produtos.ts` | Remove legacy `fornecedorId` fields |

---

## Part A — API (`api/` repo)

### Task A1: List all suppliers

**Files:**
- Modify: `api/src/modules/fornecedores/services/fornecedores.service.js:6-17`

- [ ] **Step 1: Remove active-only filter**

Replace `listarFornecedores`:

```javascript
export const listarFornecedores = async () => {
    return await supabase
        .from('fornecedores')
        .select('*')
        .order('razao_social', {
            ascending: true
        })
}
```

- [ ] **Step 2: Verify controller still calls `listarFornecedores()` with no args**

File `fornecedores.controller.js` line 19 already calls `listarFornecedores()` — no change needed.

- [ ] **Step 3: Commit (from `api/`)**

```bash
git add src/modules/fornecedores/services/fornecedores.service.js
git commit -m "feat: return all suppliers in fornecedores list"
```

---

### Task A2: Whitelist create fields

**Files:**
- Modify: `api/src/modules/fornecedores/controllers/fornecedores.controller.js`

- [ ] **Step 1: Add field extractor (pattern: `extrairDadosItem` in cotações)**

Add near top of file, after imports:

```javascript
const CAMPOS_FORNECEDOR = [
    'razao_social',
    'nome_fantasia',
    'cnpj',
    'telefone',
    'email',
    'ativo'
]

function extrairDadosFornecedor(body) {
    const dados = {}

    for (const campo of CAMPOS_FORNECEDOR) {
        if (body[campo] !== undefined) {
            dados[campo] = body[campo]
        }
    }

    return dados
}
```

- [ ] **Step 2: Use whitelist in `createFornecedor`**

Replace `await inserirFornecedor(req.body)` with:

```javascript
        const bruto = extrairDadosFornecedor(req.body)

        const dados = {
            razao_social: bruto.razao_social,
            nome_fantasia: bruto.nome_fantasia ?? null,
            cnpj: bruto.cnpj ?? null,
            telefone: bruto.telefone ?? null,
            email: bruto.email ?? null,
            ativo: bruto.ativo ?? true
        }

        const { data, error } =
            await inserirFornecedor(dados)
```

- [ ] **Step 3: Run existing API tests**

Run from `api/`:

```bash
npm test -- tests/fornecedores.test.js
```

Expected: existing tests still pass (create test with `cidade`/`estado` should still succeed — fields ignored).

- [ ] **Step 4: Commit**

```bash
git add src/modules/fornecedores/controllers/fornecedores.controller.js
git commit -m "feat: whitelist fornecedor create fields"
```

---

### Task A3: API tests — status toggle + inactive in list

**Files:**
- Modify: `api/tests/fornecedores.test.js`

- [ ] **Step 1: Fix delete section comment**

Change line 173 from:

```javascript
    // DELETE (SOFT DELETE)
```

to:

```javascript
    // DELETE (hard delete)
```

- [ ] **Step 2: Rename misleading delete test**

Change test name from `'gestor deve desativar fornecedor'` to `'gestor deve excluir fornecedor sem vínculos'`.

- [ ] **Step 3: Add PATCH status toggle test (before DELETE section)**

Insert after the update tests block:

```javascript
    // =========================
    // PATCH STATUS (toggle)
    // =========================
    it('gestor deve alternar status do fornecedor via PATCH', async () => {

        const criar = await request(app)
            .post('/fornecedores')
            .set('Authorization', `Bearer ${tokenGestor}`)
            .send({
                razao_social: `Fornecedor Status ${Date.now()}`
            })

        expect(criar.statusCode).toBe(201)

        const criado = criar.body[0] || criar.body
        const id = criado.id

        expect(criado.ativo).toBe(true)

        const inativar = await request(app)
            .patch(`/fornecedores/${id}/status`)
            .set('Authorization', `Bearer ${tokenGestor}`)

        expect(inativar.statusCode).toBe(200)
        expect(inativar.body.data.ativo).toBe(false)

        const reativar = await request(app)
            .patch(`/fornecedores/${id}/status`)
            .set('Authorization', `Bearer ${tokenGestor}`)

        expect(reativar.statusCode).toBe(200)
        expect(reativar.body.data.ativo).toBe(true)
    })

    it('fornecedor inativo deve aparecer em GET /fornecedores', async () => {

        const criar = await request(app)
            .post('/fornecedores')
            .set('Authorization', `Bearer ${tokenGestor}`)
            .send({
                razao_social: `Fornecedor Inativo ${Date.now()}`
            })

        const criado = criar.body[0] || criar.body

        await request(app)
            .patch(`/fornecedores/${criado.id}/status`)
            .set('Authorization', `Bearer ${tokenGestor}`)

        const listar = await request(app)
            .get('/fornecedores')
            .set('Authorization', `Bearer ${tokenGestor}`)

        expect(listar.statusCode).toBe(200)

        const encontrado = listar.body.find(
            (f) => f.id === criado.id
        )

        expect(encontrado).toBeDefined()
        expect(encontrado.ativo).toBe(false)
    })
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/fornecedores.test.js`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add tests/fornecedores.test.js
git commit -m "test: add fornecedor status toggle and inactive list cases"
```

**Optional squash:** If preferred, squash A1–A3 into one commit per spec:

```bash
git commit -m "feat: list all suppliers and whitelist create fields"
```

---

## Part B — Web (`web/` repo)

### Task 1: Simplify `Fornecedor` types

**Files:**
- Modify: `web/types/index.ts:143-163`

- [ ] **Step 1: Replace `Fornecedor` interface and add DTO/input types**

Replace the existing `Fornecedor` block with:

```typescript
export interface ApiFornecedorDTO {
  id: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  ativo?: boolean;
  fornecedorTemVinculos?: boolean;
}

export interface Fornecedor {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  fornecedorTemVinculos?: boolean;
}

export interface FornecedorCreateInput {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
}

export type FornecedorUpdateInput = Pick<
  FornecedorCreateInput,
  "nomeFantasia" | "telefone" | "email"
>;
```

- [ ] **Step 2: Fix TypeScript errors from removed fields**

Run: `npx tsc --noEmit 2>&1 | head -40`

Expected: errors in `fornecedores-service.ts`, `fornecedor-form.tsx`, `data-context.tsx`, etc. — fixed in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "refactor: simplify fornecedor types to api contract"
```

---

### Task 2: `fornecedores-service.ts` — mappers + CRUD

**Files:**
- Modify: `web/services/fornecedores-service.ts`
- Create: `web/services/fornecedores-service.test.ts`

- [ ] **Step 1: Write failing mapper tests**

Create `web/services/fornecedores-service.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  mapApiFornecedorToFornecedor,
  mapFornecedorCreateToApi,
  mapFornecedorUpdateToApi,
} from "./fornecedores-service";

describe("mapApiFornecedorToFornecedor", () => {
  it("maps snake_case dto to camelCase fornecedor", () => {
    expect(
      mapApiFornecedorToFornecedor({
        id: "uuid-1",
        razao_social: "ACME LTDA",
        nome_fantasia: "ACME",
        cnpj: "12345678000199",
        telefone: "43999999999",
        email: "contato@acme.com",
        ativo: true,
        fornecedorTemVinculos: true,
      }),
    ).toEqual({
      id: "uuid-1",
      razaoSocial: "ACME LTDA",
      nomeFantasia: "ACME",
      cnpj: "12345678000199",
      telefone: "43999999999",
      email: "contato@acme.com",
      ativo: true,
      fornecedorTemVinculos: true,
    });
  });

  it("defaults ativo to true and omits optional fields", () => {
    expect(
      mapApiFornecedorToFornecedor({
        id: "uuid-2",
        razao_social: "Solo Razão",
      }),
    ).toEqual({
      id: "uuid-2",
      razaoSocial: "Solo Razão",
      ativo: true,
    });
  });
});

describe("mapFornecedorCreateToApi", () => {
  it("maps camelCase create input to snake_case", () => {
    expect(
      mapFornecedorCreateToApi({
        razaoSocial: "Empresa X",
        nomeFantasia: "X",
        cnpj: "12345678000199",
        telefone: "43999999999",
        email: "x@email.com",
        ativo: false,
      }),
    ).toEqual({
      razao_social: "Empresa X",
      nome_fantasia: "X",
      cnpj: "12345678000199",
      telefone: "43999999999",
      email: "x@email.com",
      ativo: false,
    });
  });
});

describe("mapFornecedorUpdateToApi", () => {
  it("maps only editable update fields", () => {
    expect(
      mapFornecedorUpdateToApi({
        nomeFantasia: "Novo Nome",
        telefone: "43988888888",
        email: "novo@email.com",
      }),
    ).toEqual({
      nome_fantasia: "Novo Nome",
      telefone: "43988888888",
      email: "novo@email.com",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- services/fornecedores-service.test.ts`
Expected: FAIL — `mapFornecedorCreateToApi` / `mapFornecedorUpdateToApi` not exported

- [ ] **Step 3: Replace `fornecedores-service.ts` with full implementation**

```typescript
import { api } from "./api";
import { getFriendlyApiError } from "@/lib/api-errors";
import type {
  ApiFornecedorDTO,
  Fornecedor,
  FornecedorCreateInput,
  FornecedorUpdateInput,
} from "@/types";

function getErrorMessage(error: unknown, fallback: string) {
  return getFriendlyApiError(error, fallback);
}

export function mapApiFornecedorToFornecedor(dto: ApiFornecedorDTO): Fornecedor {
  return {
    id: dto.id,
    razaoSocial: dto.razao_social ?? "",
    nomeFantasia: dto.nome_fantasia ?? undefined,
    cnpj: dto.cnpj ?? undefined,
    telefone: dto.telefone ?? undefined,
    email: dto.email ?? undefined,
    ativo: dto.ativo ?? true,
    fornecedorTemVinculos: dto.fornecedorTemVinculos,
  };
}

export function mapFornecedorCreateToApi(dados: FornecedorCreateInput) {
  return {
    razao_social: dados.razaoSocial,
    nome_fantasia: dados.nomeFantasia,
    cnpj: dados.cnpj,
    telefone: dados.telefone,
    email: dados.email,
    ativo: dados.ativo,
  };
}

export function mapFornecedorUpdateToApi(dados: FornecedorUpdateInput) {
  return {
    nome_fantasia: dados.nomeFantasia,
    telefone: dados.telefone,
    email: dados.email,
  };
}

function unwrapFornecedor(data: ApiFornecedorDTO | ApiFornecedorDTO[]) {
  return Array.isArray(data) ? data[0] : data;
}

export async function listarFornecedores(): Promise<Fornecedor[]> {
  try {
    const response = await api.get<ApiFornecedorDTO[]>("/fornecedores");
    return response.data.map(mapApiFornecedorToFornecedor);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar fornecedores."));
  }
}

export async function obterFornecedor(id: string): Promise<Fornecedor> {
  try {
    const response = await api.get<ApiFornecedorDTO>(`/fornecedores/${id}`);
    return mapApiFornecedorToFornecedor(response.data);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao carregar fornecedor."));
  }
}

export async function criarFornecedor(dados: FornecedorCreateInput): Promise<Fornecedor> {
  try {
    const response = await api.post<ApiFornecedorDTO | ApiFornecedorDTO[]>(
      "/fornecedores",
      mapFornecedorCreateToApi(dados),
    );
    return mapApiFornecedorToFornecedor(unwrapFornecedor(response.data));
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao criar fornecedor."));
  }
}

export async function atualizarFornecedor(
  id: string,
  dados: FornecedorUpdateInput,
): Promise<Fornecedor> {
  try {
    const response = await api.put<ApiFornecedorDTO | ApiFornecedorDTO[]>(
      `/fornecedores/${id}`,
      mapFornecedorUpdateToApi(dados),
    );
    return mapApiFornecedorToFornecedor(unwrapFornecedor(response.data));
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao atualizar fornecedor."));
  }
}

export async function alternarStatusFornecedor(id: string): Promise<Fornecedor> {
  try {
    const response = await api.patch<{ data: ApiFornecedorDTO }>(
      `/fornecedores/${id}/status`,
    );
    return mapApiFornecedorToFornecedor(response.data.data);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao alterar status do fornecedor."));
  }
}

export async function excluirFornecedor(id: string): Promise<void> {
  try {
    await api.delete(`/fornecedores/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Erro ao excluir fornecedor."));
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- services/fornecedores-service.test.ts`
Expected: PASS (3 describe blocks)

- [ ] **Step 5: Commit**

```bash
git add services/fornecedores-service.ts services/fornecedores-service.test.ts
git commit -m "feat: add fornecedores service crud and mappers"
```

---

### Task 3: Expand `use-fornecedores.ts` + add `useFornecedor(id)`

**Files:**
- Modify: `web/hooks/use-fornecedores.ts`

- [ ] **Step 1: Replace hook file**

```typescript
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarFornecedores,
  obterFornecedor,
  criarFornecedor,
  atualizarFornecedor,
  alternarStatusFornecedor,
  excluirFornecedor,
} from "@/services/fornecedores-service";
import type { FornecedorCreateInput, FornecedorUpdateInput } from "@/types";

export function useFornecedores() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["fornecedores"],
    queryFn: listarFornecedores,
    staleTime: 1000 * 60,
  });

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ["fornecedores"] });

  const createMutation = useMutation({
    mutationFn: (dados: FornecedorCreateInput) => criarFornecedor(dados),
    onSuccess: invalidateList,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: FornecedorUpdateInput }) =>
      atualizarFornecedor(id, dados),
    onSuccess: (_, { id }) => {
      invalidateList();
      queryClient.invalidateQueries({ queryKey: ["fornecedores", id] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => alternarStatusFornecedor(id),
    onSuccess: (_, id) => {
      invalidateList();
      queryClient.invalidateQueries({ queryKey: ["fornecedores", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => excluirFornecedor(id),
    onSuccess: invalidateList,
  });

  return {
    fornecedores: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    criarFornecedor: createMutation.mutateAsync,
    atualizarFornecedor: updateMutation.mutateAsync,
    alternarStatusFornecedor: toggleStatusMutation.mutateAsync,
    excluirFornecedor: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
    query,
  };
}

export function useFornecedor(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["fornecedores", id],
    queryFn: () => obterFornecedor(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
    queryClient.invalidateQueries({ queryKey: ["fornecedores", id] });
  };

  const updateMutation = useMutation({
    mutationFn: (dados: FornecedorUpdateInput) => atualizarFornecedor(id, dados),
    onSuccess: invalidate,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () => alternarStatusFornecedor(id),
    onSuccess: invalidate,
  });

  return {
    fornecedor: query.data ?? null,
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    atualizarFornecedor: updateMutation.mutateAsync,
    alternarStatusFornecedor: toggleStatusMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    query,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add hooks/use-fornecedores.ts
git commit -m "feat: add fornecedor mutations and useFornecedor hook"
```

---

### Task 4: List page — `app/fornecedores/page.tsx`

**Files:**
- Modify: `web/app/fornecedores/page.tsx` (full rewrite)

**Reference:** `app/usuarios/page.tsx` (actions + vínculos), `app/produtos/page.tsx` (status filter + pagination)

- [ ] **Step 1: Replace page implementation**

Key requirements:
- `useFornecedores()` instead of `useData()`
- `DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}` — remove `ProtectedRoute` wrapper
- Loading: `TableLoading`; error: destructive `Alert` + refetch button
- Search: `razaoSocial`, `nomeFantasia`, `cnpj`
- Status filter Select: `todos` / `ativos` / `inativos`
- Client pagination: 10 per page with `Pagination` components
- Columns: Nome Fantasia, CNPJ, Telefone, Status, Ações (no Cidade/UF)
- Display name: `fornecedor.nomeFantasia ?? fornecedor.razaoSocial`
- Use `formatCnpj` / `formatPhone` from `@/lib/formatters`
- Use `StatusBadge` for status column
- Row actions via `TableActions`:
  - Visualizar — always
  - Editar — always
  - Inativar — `ativo === true`; `window.confirm` before call
  - Reativar — `ativo === false`; `window.confirm` before call
  - Excluir — disabled when `fornecedorTemVinculos`; tooltip via `title` prop; `window.confirm` before call
- Track `actionError` state for mutation failures (separate from load error)

Handler skeleton:

```typescript
const handleToggleStatus = async (fornecedor: Fornecedor) => {
  const nome = fornecedor.nomeFantasia ?? fornecedor.razaoSocial;
  const acao = fornecedor.ativo ? "Inativar" : "Reativar";
  if (!window.confirm(`${acao} o fornecedor ${nome}?`)) return;

  setActionError(null);
  setActionId(fornecedor.id);
  try {
    await alternarStatusFornecedor(fornecedor.id);
  } catch (error) {
    setActionError(error instanceof Error ? error.message : `Erro ao ${acao.toLowerCase()} fornecedor.`);
  } finally {
    setActionId(null);
  }
};

const handleDelete = async (fornecedor: Fornecedor) => {
  const nome = fornecedor.nomeFantasia ?? fornecedor.razaoSocial;
  if (!window.confirm(`Excluir o fornecedor ${nome}?`)) return;

  setActionError(null);
  setActionId(fornecedor.id);
  try {
    await excluirFornecedor(fornecedor.id);
  } catch (error) {
    setActionError(error instanceof Error ? error.message : "Erro ao excluir fornecedor.");
  } finally {
    setActionId(null);
  }
};
```

Imports to include: `Filter`, `Search`, `Eye`, `Edit`, `Trash2`, `Ban`, `CheckCircle` (or `RotateCcw` for reativar), `PERFIS_GESTAO_BASE`, `TableLoading`, `Empty`, `Pagination*`, `Select*`, `TableActions`, `TableActionLink`, `TableActionButton`, `StatusBadge`, `useMemo`.

- [ ] **Step 2: Manual smoke — list loads from API**

With dev server + API running, open `/fornecedores` as gestor.
Expected: table shows API data with loading/error states working.

- [ ] **Step 3: Commit**

```bash
git add app/fornecedores/page.tsx
git commit -m "feat: wire fornecedores list to api with filters and actions"
```

---

### Task 5: Simplified form — `fornecedor-form.tsx`

**Files:**
- Modify: `web/components/fornecedores/fornecedor-form.tsx`

- [ ] **Step 1: Replace form with 6 contract fields**

Remove: address card, IE, contact person, `UF_OPTIONS`, `useData`.

Use `useFornecedores()` for create; accept optional `onSubmit` props OR call mutations directly:

```typescript
const { criarFornecedor, atualizarFornecedor, alternarStatusFornecedor } = useFornecedores();
```

Form state:

```typescript
const [formData, setFormData] = useState({
  razaoSocial: fornecedor?.razaoSocial ?? "",
  nomeFantasia: fornecedor?.nomeFantasia ?? "",
  cnpj: fornecedor?.cnpj ? formatCnpj(fornecedor.cnpj) : "",
  telefone: fornecedor?.telefone ? formatPhone(fornecedor.telefone) : "",
  email: fornecedor?.email ?? "",
  ativo: fornecedor?.ativo ?? true,
});
```

Submit logic:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.razaoSocial.trim()) {
    setSubmitError("Razão social é obrigatória.");
    return;
  }

  setIsSubmitting(true);
  setSubmitError(null);

  try {
    if (isEditing && fornecedor) {
      await atualizarFornecedor({
        id: fornecedor.id,
        dados: {
          nomeFantasia: formData.nomeFantasia || undefined,
          telefone: onlyDigits(formData.telefone) || undefined,
          email: formData.email || undefined,
        },
      });

      if (formData.ativo !== fornecedor.ativo) {
        await alternarStatusFornecedor(fornecedor.id);
      }
    } else {
      await criarFornecedor({
        razaoSocial: formData.razaoSocial.trim(),
        nomeFantasia: formData.nomeFantasia || undefined,
        cnpj: onlyDigits(formData.cnpj) || undefined,
        telefone: onlyDigits(formData.telefone) || undefined,
        email: formData.email || undefined,
        ativo: formData.ativo,
      });
    }

    router.push("/fornecedores");
  } catch (error) {
    setSubmitError(error instanceof Error ? error.message : "Erro ao salvar fornecedor.");
  } finally {
    setIsSubmitting(false);
  }
};
```

Field rules:
- **Create:** all fields editable; only Razão Social required (`*`)
- **Edit:** Razão Social + CNPJ `readOnly`; Nome Fantasia, Telefone, E-mail, Ativo editable
- Single card titled "Dados do Fornecedor"
- Import `onlyDigits` from `@/lib/formatters`

- [ ] **Step 2: Commit**

```bash
git add components/fornecedores/fornecedor-form.tsx
git commit -m "feat: simplify fornecedor form to api contract fields"
```

---

### Task 6: Detail page — `app/fornecedores/[id]/page.tsx`

**Files:**
- Modify: `web/app/fornecedores/[id]/page.tsx`

**Reference:** `app/pacientes/[id]/page.tsx` loading/error pattern

- [ ] **Step 1: Replace with API-backed detail**

```typescript
"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useFornecedor } from "@/hooks/use-fornecedores";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/shared/status-badge";
import { Spinner } from "@/components/ui/spinner";
import { PERFIS_GESTAO_BASE } from "@/lib/access-control";
import { formatCnpj, formatPhone } from "@/lib/formatters";
import { ArrowLeft, Pencil, Building2, Phone, Mail } from "lucide-react";

interface FornecedorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function FornecedorDetailPage({ params }: FornecedorDetailPageProps) {
  const { id } = use(params);
  const { fornecedor, isLoading, error } = useFornecedor(id);

  if (isLoading) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
        <div className="flex min-h-80 items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="h-5 w-5" />
          <span>Carregando fornecedor...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !fornecedor) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar o fornecedor</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (!fornecedor) {
    notFound();
  }

  const displayName = fornecedor.nomeFantasia ?? fornecedor.razaoSocial;

  return (
    <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/fornecedores">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
                <StatusBadge status={fornecedor.ativo ? "ativo" : "inativo"} />
              </div>
              <p className="text-muted-foreground">{fornecedor.razaoSocial}</p>
            </div>
          </div>
          <Button asChild>
            <Link href={`/fornecedores/${fornecedor.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados do Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Razão Social</p>
              <p>{fornecedor.razaoSocial}</p>
            </div>
            {fornecedor.nomeFantasia && (
              <div>
                <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                <p>{fornecedor.nomeFantasia}</p>
              </div>
            )}
            {fornecedor.cnpj && (
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="font-mono">{formatCnpj(fornecedor.cnpj)}</p>
              </div>
            )}
            {fornecedor.telefone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{formatPhone(fornecedor.telefone)}</span>
              </div>
            )}
            {fornecedor.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{fornecedor.email}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/fornecedores/[id]/page.tsx
git commit -m "feat: load fornecedor detail from api"
```

---

### Task 7: Edit + Novo pages

**Files:**
- Modify: `web/app/fornecedores/[id]/editar/page.tsx`
- Modify: `web/app/fornecedores/novo/page.tsx`

- [ ] **Step 1: Rewrite edit page**

```typescript
"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FornecedorForm } from "@/components/fornecedores/fornecedor-form";
import { useFornecedor } from "@/hooks/use-fornecedores";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { PERFIS_GESTAO_BASE } from "@/lib/access-control";

interface EditarFornecedorPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarFornecedorPage({ params }: EditarFornecedorPageProps) {
  const { id } = use(params);
  const { fornecedor, isLoading, error } = useFornecedor(id);

  if (isLoading) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
        <div className="flex min-h-80 items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="h-5 w-5" />
          <span>Carregando fornecedor...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !fornecedor) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar o fornecedor</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (!fornecedor) {
    notFound();
  }

  return (
    <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
      <FornecedorForm fornecedor={fornecedor} isEditing />
    </DashboardLayout>
  );
}
```

- [ ] **Step 2: Update novo page layout**

Replace `ProtectedRoute` wrapper with:

```typescript
"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FornecedorForm } from "@/components/fornecedores/fornecedor-form";
import { PERFIS_GESTAO_BASE } from "@/lib/access-control";

export default function NovoFornecedorPage() {
  return (
    <DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}>
      <FornecedorForm />
    </DashboardLayout>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/fornecedores/[id]/editar/page.tsx app/fornecedores/novo/page.tsx
git commit -m "feat: load fornecedor edit page from api"
```

---

### Task 8: Remove mocks and Context slice

**Files:**
- Delete: `web/mocks/fornecedores.ts`
- Modify: `web/mocks/index.ts`
- Modify: `web/mocks/produtos.ts`
- Modify: `web/contexts/data-context.tsx`

- [ ] **Step 1: Delete mock file and export**

Delete `mocks/fornecedores.ts`.

Update `mocks/index.ts` — remove line:

```typescript
export { fornecedoresMock } from './fornecedores'
```

- [ ] **Step 2: Remove `fornecedorId` from produtos mock**

In `mocks/produtos.ts`, remove all `fornecedorId: '...'` properties from mock objects (produtos mock should not reference deleted fornecedor IDs).

- [ ] **Step 3: Remove fornecedores slice from `data-context.tsx`**

Remove:
- `fornecedoresMock` import
- `fornecedores` from interface + state (`useState<Fornecedor[]>`)
- `getFornecedorById`, `addFornecedor`, `updateFornecedor`, `deleteFornecedor` callbacks
- Corresponding provider value exports

- [ ] **Step 4: Verify no remaining `useData()` fornecedor references**

Run:

```bash
rg "useData\(\)" web/app/fornecedores web/components/fornecedores
rg "fornecedoresMock|getFornecedorById|addFornecedor|updateFornecedor|deleteFornecedor" web/
```

Expected: no matches in fornecedores pages/components; only docs/history if any.

- [ ] **Step 5: Run unit tests + typecheck**

Run:

```bash
npm test
npx tsc --noEmit
```

Expected: tests PASS; no TS errors

- [ ] **Step 6: Commit**

```bash
git add mocks/ contexts/data-context.tsx
git commit -m "refactor: remove fornecedores mocks and context slice"
```

---

### Task 9: Fix `cotacao-form.tsx` display fallback

**Files:**
- Modify: `web/components/cotacoes/cotacao-form.tsx:361`

- [ ] **Step 1: Remove `f.nome` fallback**

Change:

```typescript
{f.nomeFantasia ?? f.razaoSocial ?? f.nome}
```

to:

```typescript
{f.nomeFantasia ?? f.razaoSocial}
```

- [ ] **Step 2: Commit**

```bash
git add components/cotacoes/cotacao-form.tsx
git commit -m "fix: remove deprecated fornecedor nome field from picker"
```

**Optional squash:** Tasks 1–9 can squash into spec's single web commit:

```bash
git commit -m "feat: wire fornecedores pages to api and remove mocks"
```

---

### Task 10: Manual verification

Run with API + `npm run dev` in `web/`. Login as `gestor@email.com` / `123`.

- [ ] **Flow 1:** List `/fornecedores` — API data, loading/error states
- [ ] **Flow 2:** Status filter — Ativos / Inativos / Todos
- [ ] **Flow 3:** Create — only razão social required; redirects to list
- [ ] **Flow 4:** Detail — contract fields only (no address/contact cards)
- [ ] **Flow 5:** Edit — razão social and CNPJ read-only
- [ ] **Flow 6:** Inactivate active — status changes; visible in Inativos filter
- [ ] **Flow 7:** Reactivate inactive — status returns to Ativo
- [ ] **Flow 8:** Delete without vínculos — removed from list
- [ ] **Flow 9:** Delete with vínculos — button disabled with tooltip
- [ ] **Flow 10:** Cotação supplier picker — active only (+ linked on edit)
- [ ] **Flow 11:** Create → use in cotação — appears in picker after cache invalidation

---

## Spec Coverage Checklist

| Spec requirement | Task |
|-----------------|------|
| API list returns all suppliers | A1 |
| API create field whitelist | A2 |
| API tests (comment, toggle, inactive list) | A3 |
| Simplified `Fornecedor` type + DTO/inputs | 1 |
| Service CRUD + mappers + unit tests | 2 |
| `useFornecedores()` mutations + `useFornecedor(id)` | 3 |
| List page (filters, pagination, actions) | 4 |
| Simplified form (6 fields, create/edit rules) | 5 |
| Detail page (contract fields, loading/error) | 6 |
| Edit + Novo pages via hook | 7 |
| Remove mocks + Context slice | 8 |
| Cotação picker compatibility | 9 |
| Manual verification flows | 10 |

---

## Execution Handoff

Plan complete and saved to `web/docs/superpowers/plans/2026-06-08-gerenciar-fornecedores.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
