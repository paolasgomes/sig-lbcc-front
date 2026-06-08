# RF_B3 — Gerenciar Fornecedores (Design Spec)

**Date:** 2026-06-08  
**Status:** Approved  
**Scope:** `web/` frontend integration + minimal `api/` adjustments  
**Test user:** `gestor@email.com` / `123`

## Summary

Wire the existing fornecedores UI in `web/` to the real API (`/fornecedores`), remove all mocks and Context usage for this module, and align the data model with the backend contract. The form is simplified to six fields. Primary lifecycle actions are **inactivate/reactivate** (`PATCH /status`) and **hard delete** when no cotação vínculos exist.

## Decisions

| Topic | Decision |
|-------|----------|
| Fields | API contract only: `razao_social`, `nome_fantasia`, `cnpj`, `telefone`, `email`, `ativo` |
| Form | Simplified — remove address, IE, contact person, `tipoServico` |
| Required on create | Only `razao_social` (matches API minimum) |
| List | API returns all suppliers (active + inactive); filters on frontend |
| Delete vs inactivate | Inactivate/reactivate as primary; delete only when `fornecedorTemVinculos === false` |
| Architecture | Single migration mirroring Usuários: service + hooks + pages; no Context |
| Write permissions | Gestor only (matches API); UI gate `ROLES_GESTAO_COMPLETA` (`admin`, `gestor`) |
| Repos | Separate git repos in `api/` and `web/` — independent commits |

## Architecture

```
app/fornecedores/*
    ↓
hooks (use-fornecedores, use-fornecedor)
    ↓
services/fornecedores-service.ts → services/api.ts
    ↓
API (/fornecedores)
```

Cotações continue using the same `useFornecedores()` hook for the item supplier picker — one shared data source after migration.

## Data Model

### `Fornecedor` (replaces current interface)

| UI field (camelCase) | API field | Required (create) | Editable (update) | Notes |
|---------------------|-----------|-------------------|-------------------|-------|
| `id` | `id` | — | — | UUID |
| `razaoSocial` | `razao_social` | yes | no | Immutable after create |
| `nomeFantasia` | `nome_fantasia` | no | yes | |
| `cnpj` | `cnpj` | no | no | Immutable after create; unique constraint in API |
| `telefone` | `telefone` | no | yes | |
| `email` | `email` | no | yes | |
| `ativo` | `ativo` | no (default `true`) | yes (via form or toggle) | |
| `fornecedorTemVinculos` | `fornecedorTemVinculos` | — | — | Enriched on list response; disables delete in UI |

### Input types

```typescript
interface FornecedorCreateInput {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
}

type FornecedorUpdateInput = Pick<
  FornecedorCreateInput,
  "nomeFantasia" | "telefone" | "email"
>;
```

### Removed from frontend model

`nome`, `tipoServico`, `contato`, `telefoneContato`, `inscricaoEstadual`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `cep`.

## API Changes (`api/`)

Minimal changes to existing module at `api/src/modules/fornecedores/`. No new routes, no DB migration.

### List — return all suppliers

**File:** `fornecedores.service.js` → `listarFornecedores`

Remove `.eq('ativo', ativo)` filter and the `ativo` parameter. Order by `razao_social` ascending. Controller enrichment with `fornecedorTemVinculos` per row remains unchanged.

### Create — field whitelist

**File:** `fornecedores.controller.js` → `createFornecedor`

Replace `inserirFornecedor(req.body)` with explicit extraction (pattern: `extrairDadosItem` in cotações):

| API field | Default |
|-----------|---------|
| `razao_social` | required |
| `nome_fantasia` | `null` |
| `cnpj` | `null` |
| `telefone` | `null` |
| `email` | `null` |
| `ativo` | `true` |

Unknown fields (e.g. `cidade`, `estado`) are silently ignored.

### Update — no scope change

Service already persists only `nome_fantasia`, `telefone`, `email`. `razao_social` and `cnpj` are immutable after creation.

### Endpoint usage

| Endpoint | UI usage |
|----------|----------|
| `GET /fornecedores` | List (+ `fornecedorTemVinculos`) |
| `GET /fornecedores/:id` | Detail and edit load |
| `POST /fornecedores` | Create |
| `PUT /fornecedores/:id` | Edit |
| `PATCH /fornecedores/:id/status` | Inactivate and reactivate (toggle) |
| `DELETE /fornecedores/:id` | Hard delete; blocked when vínculos exist |

`GET /fornecedores/:id/relacionamentos` stays available but UI uses `fornecedorTemVinculos` from list (same as Usuários).

### API tests (`api/tests/fornecedores.test.js`)

- Fix comment `"DELETE (SOFT DELETE)"` → `"hard delete"`
- Add test for `PATCH /:id/status` toggle
- Add test confirming inactive supplier appears in `GET /fornecedores`
- Keep existing permission and CNPJ duplicate tests

### Out of scope (API)

- Server-side pagination
- Permission changes (`admin` is not an API perfil)
- New DB columns
- N+1 optimization on list enrichment

## Web Data Layer (`web/`)

### Types (`types/index.ts`)

- Simplify `Fornecedor` interface (see Data Model)
- Add `FornecedorCreateInput`, `FornecedorUpdateInput`
- Move `ApiFornecedorDTO` to `types/index.ts` (pattern: `ApiAreaDTO`)

### Service (`services/fornecedores-service.ts`)

Expand existing read-only service:

| Function | Endpoint |
|----------|----------|
| `listarFornecedores()` | `GET /fornecedores` |
| `obterFornecedor(id)` | `GET /fornecedores/:id` |
| `criarFornecedor(dados)` | `POST /fornecedores` |
| `atualizarFornecedor(id, dados)` | `PUT /fornecedores/:id` |
| `alternarStatusFornecedor(id)` | `PATCH /fornecedores/:id/status` |
| `excluirFornecedor(id)` | `DELETE /fornecedores/:id` |

Mappers:

- `mapApiFornecedorToFornecedor(dto)` — includes `fornecedorTemVinculos`
- `mapFornecedorCreateToApi(dados)` — camelCase → snake_case
- `mapFornecedorUpdateToApi(dados)` — `{ nome_fantasia, telefone, email }`

Errors via `getFriendlyApiError` (existing pattern).

### Hooks (`hooks/use-fornecedores.ts`)

Expand existing read-only hook. `cotacao-form.tsx` keeps importing `useFornecedores()` without breaking changes.

#### `useFornecedores()` — list + mutations

Returns: `fornecedores`, `isLoading`, `error`, `refetch`, `criarFornecedor`, `atualizarFornecedor`, `alternarStatusFornecedor`, `excluirFornecedor`.

Mutations invalidate `["fornecedores"]` on success.

#### `useFornecedor(id)` — detail hook (new, mirrors `usePaciente`)

Returns: `fornecedor`, `isLoading`, `error`, `refetch`, `atualizarFornecedor`, `alternarStatusFornecedor`.

Query key: `["fornecedores", id]`. Mutations invalidate list + detail.

### Cache keys

| Key | Usage |
|-----|-------|
| `["fornecedores"]` | List + cotação supplier picker |
| `["fornecedores", id]` | Detail + edit |

### Context removal

From `contexts/data-context.tsx`, remove:

- `fornecedoresMock` import
- `fornecedores` state
- `getFornecedorById`, `addFornecedor`, `updateFornecedor`, `deleteFornecedor`
- Corresponding interface and provider exports

Verify no remaining references to `useData()` for fornecedores anywhere in the codebase.

### Mock removal

| File | Action |
|------|--------|
| `mocks/fornecedores.ts` | Delete |
| `mocks/index.ts` | Remove export |
| `mocks/produtos.ts` | Remove legacy `fornecedorId` references if present |

## UI Changes

Visual references: **Usuários** (inactivate/delete actions + `fornecedorTemVinculos`) and **Produtos** (status filter, client pagination, loading/error states).

### List — `app/fornecedores/page.tsx`

- Replace `useData()` with `useFornecedores()`
- Layout: `DashboardLayout perfisPermitidos={PERFIS_GESTAO_BASE}`
- Loading: `TableLoading`; error: `Alert` + refetch
- Client search by `razaoSocial`, `nomeFantasia`, `cnpj`
- Status filter: Todos / Ativos / Inativos
- Client pagination: 10 per page
- Columns: Nome Fantasia, CNPJ, Telefone, Status, Ações (remove Cidade/UF)

**Row actions** (`TableActions`):

| Action | Condition |
|--------|-----------|
| Visualizar | always |
| Editar | always |
| Inativar | `ativo === true` |
| Reativar | `ativo === false` |
| Excluir | `!fornecedorTemVinculos`; disabled with tooltip when linked |

Confirm via `window.confirm` before inactivate/reactivate/delete.

### Form — `components/fornecedores/fornecedor-form.tsx`

Single card with contract fields. Replace `useData()` with hook mutations.

| Field | Create | Edit | Required |
|-------|--------|------|----------|
| Razão Social | editable | read-only | yes |
| Nome Fantasia | editable | editable | no |
| CNPJ | editable | read-only | no |
| Telefone | editable | editable | no |
| E-mail | editable | editable | no |
| Ativo | editable | editable | no (default `true`) |

Remove address, IE, and contact person cards. Keep `formatCnpj` / `formatPhone` for display.

### Detail — `app/fornecedores/[id]/page.tsx`

- Replace `useData()` with `useFornecedor(id)`
- Loading/error pattern from `app/pacientes/[id]/page.tsx`
- Display contract fields only; remove address and contact cards

### Auxiliary pages

- `app/fornecedores/novo/page.tsx` — no structural change
- `app/fornecedores/[id]/editar/page.tsx` — load via `useFornecedor(id)` with loading/error/notFound

### Cotações impact

`components/cotacoes/cotacao-form.tsx` already filters active suppliers (plus linked inactive on edit). No changes required beyond benefiting from the expanded shared hook.

## Testing

### API (`api/tests/fornecedores.test.js`)

- Keep existing tests
- Fix soft-delete comment
- Add toggle status test
- Add inactive-in-list test

### Web (`web/services/fornecedores-service.test.ts` — new)

Unit tests for mappers (pattern: `cotacoes-service.test.ts`):

- `mapApiFornecedorToFornecedor`
- `mapFornecedorCreateToApi`
- `mapFornecedorUpdateToApi`

### Manual verification (browser)

| # | Flow | Expected |
|---|------|----------|
| 1 | List `/fornecedores` | API data, loading/error states |
| 2 | Status filter | Ativos / Inativos / Todos |
| 3 | Create | Only `razao_social` required; redirects to list |
| 4 | Detail | Contract fields only |
| 5 | Edit | `razaoSocial` and `cnpj` read-only |
| 6 | Inactivate active | Status changes; visible in Inativos filter |
| 7 | Reactivate inactive | Status returns to Ativo |
| 8 | Delete without vínculos | Removed from list |
| 9 | Delete with vínculos | Button disabled or API error |
| 10 | Cotação supplier picker | Active only (+ linked on edit) |
| 11 | Create → use in cotação | Appears in picker after cache invalidation |

## Cleanup Checklist

- [ ] `mocks/fornecedores.ts` deleted
- [ ] Export removed from `mocks/index.ts`
- [ ] Fornecedores slice removed from `data-context.tsx`
- [ ] No `useData()` in `/fornecedores/*` pages
- [ ] `Fornecedor` type simplified
- [ ] `cotacao-form.tsx` works with expanded hook

## Commits

**API (`api/`):**
```
feat: list all suppliers and whitelist create fields
```

**Web (`web/`):**
```
feat: wire fornecedores pages to api and remove mocks
```

## Out of Scope

- Address, IE, secondary contact, `tipoServico`
- Server-side pagination
- `cotacao_propostas` CRUD
- API permission changes
- React Context in `web/` for fornecedores
- N+1 list optimization in API

## File Index

### API — modify

| File | Change |
|------|--------|
| `src/modules/fornecedores/services/fornecedores.service.js` | Remove active-only list filter |
| `src/modules/fornecedores/controllers/fornecedores.controller.js` | Whitelist create fields |
| `tests/fornecedores.test.js` | Fix comments + new cases |

### Web — modify

| File | Change |
|------|--------|
| `types/index.ts` | Simplify `Fornecedor`, add inputs/DTO |
| `services/fornecedores-service.ts` | Full CRUD + mappers |
| `services/fornecedores-service.test.ts` | New mapper tests |
| `hooks/use-fornecedores.ts` | Mutations + `useFornecedor(id)` |
| `app/fornecedores/page.tsx` | Hook + Usuários-style actions |
| `app/fornecedores/[id]/page.tsx` | Hook + simplified detail |
| `app/fornecedores/[id]/editar/page.tsx` | Hook loading |
| `components/fornecedores/fornecedor-form.tsx` | Simplified form + hook |
| `contexts/data-context.tsx` | Remove fornecedores slice |

### Web — delete

| File | Change |
|------|--------|
| `mocks/fornecedores.ts` | Delete |
| `mocks/index.ts` | Remove export |
