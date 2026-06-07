# RF_B5 — Gerenciar Cotações (Design Spec)

**Date:** 2026-06-07  
**Status:** Approved  
**Scope:** `web/` frontend integration with existing `api/` endpoints  
**Test user:** `gestor@email.com` / `123`

## Summary

Wire the existing cotações UI in `web/` to the real API (`/cotacoes`, `/cotacao-itens`), remove all mocks, and align the data model with what the backend exposes today. No approval workflow, no supplier/proposal flows, no monetary values. Primary state is **Ativa/Inativa** (`ativo`); `data_validade` is informational with an optional expired visual hint.

## Decisions

| Topic | Decision |
|-------|----------|
| Data source | API only — remove mocks completely |
| Status model | `ativo` boolean (Ativa/Inativa); no workflow statuses |
| `data_validade` | Display + optional warning when past due; not a managed status |
| Architecture | Approach 1: single `cotacoes-service.ts` + expanded `use-cotacoes.ts` |
| Routes | Keep existing: `/cotacoes`, `/nova`, `/[id]`, `/[id]/editar` |
| State management | Service → React Query hook → pages; **no Context** in cotações modules |
| Write permissions | Gestor only (matches API); read for authenticated users in `ROLES_ATENDIMENTOS_E_COTACOES` |

## Architecture

```
app/cotacoes/*
    ↓
hooks (use-cotacoes, use-pacientes, use-areas, use-usuario)
    ↓
services/cotacoes-service.ts → services/api.ts
    ↓
API (/cotacoes, /cotacao-itens)
```

### New hook: `use-usuario.ts`

Extract JWT parsing from `auth-context.tsx` into a standalone hook that reads the token cookie and derives `perfil`. Used for gestor-only UI gating in cotações files without importing `@/contexts/*`.

## Data Model

### `Cotacao` (replaces current interface)

| UI field (camelCase) | API field | Required | Notes |
|---------------------|-----------|----------|-------|
| `id` | `id` | — | UUID |
| `descricao` | `descricao` | yes (form) | Title/summary |
| `pacienteId` | `paciente_id` | yes (form) | FK |
| `areaId` | `area_id` | yes (form) | FK |
| `dataValidade` | `data_validade` | yes (form) | ISO date string |
| `observacoes` | `observacoes` | no | |
| `ativo` | `ativo` | — | Primary status |
| `numero` | `numero` | no | Display if present; else truncated UUID |
| `criadoEm` | `created_at` | — | |
| `pacienteNome` | `pacientes.nome` | — | From API join |
| `areaNome` | `areas.nome` | — | From API join |
| `itens` | `/cotacao-itens` | yes (form, ≥1) | Loaded separately |

### `ItemCotacao` (replaces current interface)

| Field | Required | Notes |
|-------|----------|-------|
| `id` | — | Present after save |
| `descricao` | yes | Free text |
| `quantidade` | yes | > 0 |
| `unidade` | yes | Free text or common-unit select |
| `ordem` | — | Auto from form index |

### Removed from frontend model

`fornecedorId`, `valorTotal`, `valorUnitario`, `precoUnitario`, `produtoId`, workflow `status` values (`rascunho`, `enviada`, `aprovada`, etc.), `dataSolicitacao`, `dataAprovacao`, `aprovadoPor`, `criadoPor`.

### Utility: `lib/cotacoes-utils.ts`

```typescript
isCotacaoVencida(dataValidade: string): boolean
// true when dataValidade < today (date-only comparison)
```

## Service Layer (`services/cotacoes-service.ts`)

Follow `services/produtos-service.ts` pattern: DTO types, mappers, `getFriendlyApiError`.

### Cotacao endpoints

| Function | HTTP | Path |
|----------|------|------|
| `listarCotacoes(ativo?)` | GET | `/cotacoes?ativo=` |
| `obterCotacao(id)` | GET | `/cotacoes/:id` + parallel item fetch |
| `criarCotacao(dados)` | POST | `/cotacoes` |
| `atualizarCotacao(id, dados)` | PUT | `/cotacoes/:id` |
| `alternarStatusCotacao(id)` | PATCH | `/cotacoes/:id/status` |
| `excluirCotacao(id)` | DELETE | `/cotacoes/:id` |

### Item endpoints (same file)

| Function | HTTP | Path |
|----------|------|------|
| `listarItensCotacao(cotacaoId)` | GET | `/cotacao-itens/cotacao/:cotacaoId` |
| `criarItemCotacao(cotacaoId, dados)` | POST | `/cotacao-itens/cotacao/:cotacaoId` |
| `atualizarItemCotacao(id, dados)` | PUT | `/cotacao-itens/:id` |
| `excluirItemCotacao(id)` | DELETE | `/cotacao-itens/:id` |

### Create flow

1. POST `/cotacoes` with header fields (`descricao`, `data_validade`, `paciente_id`, `area_id`, `observacoes`)
2. Loop POST items for the new `id`
3. Redirect to `/cotacoes/:id`

### Edit flow

1. PUT `/cotacoes/:id` with changed header fields
2. Sync items: create new, update existing, delete removed

### Delete error handling

When API returns `400` with `cotacaoTemVinculos: true`, surface `relacionamentos.propostas` and `relacionamentos.itens` counts in the UI message.

## Hook Layer (`hooks/use-cotacoes.ts`)

Expand to match `hooks/use-usuarios.ts`:

- `useQuery` key `["cotacoes"]` → `listarCotacoes`
- `useQuery` key `["cotacoes", id]` → `obterCotacao`
- Mutations: create, update, toggle status, delete
- `invalidateQueries({ queryKey: ["cotacoes"] })` on success
- Expose: `cotacoes`, `isLoading`, `error`, `refetch`, mutation helpers

## Pages & Components

### List (`app/cotacoes/page.tsx`)

Mirror `app/usuarios/page.tsx`:

**Columns:** Número, Descrição, Paciente, Validade (with ⚠ if vencida), Itens count, Status (Ativa/Inativa), Actions.

**Filters:** Search (descrição, paciente, número) + ativo filter (todas / ativas / inativas).

**Gestor actions:** Nova Cotação, Editar, Ativar/Inativar, Excluir.

**States:** `TableLoading`, destructive `Alert` + retry, `Empty` with CTA.

Remove: valor total column, workflow status filter, `ProtectedRoute` wrapper.

Use `DashboardLayout` with `allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}`.

### Form (`components/cotacoes/cotacao-form.tsx`)

**Fields:** paciente (`usePacientes`), área (`useAreas`), descrição, data validade, observações.

**Items table:** descricao / quantidade / unidade — add/remove rows. Minimum 1 item required.

**Single submit:** "Salvar" (no draft/send split).

**Pre-fill:** `?pacienteId=` query param from patient tab link.

Remove: produto picker, fornecedor, preços, dual submit buttons.

### Detail (`app/cotacoes/[id]/page.tsx`)

Read-only cards: general info, items table, metadata.

Remove: approve/reject, currency totals, produto/fornecedor lookups via Context.

**Gestor actions:** Editar, Ativar/Inativar (`AlertDialog`), Excluir (`AlertDialog` with vínculos message).

### Edit (`app/cotacoes/[id]/editar/page.tsx`)

Load via `obterCotacao(id)`; gestor-only action buttons.

### Patient tab (`components/pacientes/paciente-cotacoes.tsx`)

Replace `useData`/`useAuth` with `useCotacoes` (filter by `pacienteId` client-side) and `useUsuario`.

Columns: descrição, área, validade, ativo, actions. No monetary values.

### Dashboard (`app/dashboard/page.tsx`)

Replace `getStats().totalCotacoes` / `cotacoesVencidas` with computed values from `useCotacoes`:

- Total: all cotacoes count
- Vencidas: `ativo && isCotacaoVencida(dataValidade)`

### Reports (`app/relatorios/page.tsx`) — minimal update

Replace `useData().cotacoes` with `useCotacoes`. Replace workflow status charts with: total, ativas, inativas, vencidas. Remove monetary aggregations.

## Permissions

| Action | API rule | UI rule |
|--------|----------|---------|
| List / view | Any authenticated | `ROLES_ATENDIMENTOS_E_COTACOES` via layout |
| Create / edit / delete / toggle | Gestor only | Hide buttons when `perfil !== gestor`; API 403 as fallback |

## Mock & Context Cleanup

### Delete

- `mocks/cotacoes.ts`
- Export from `mocks/index.ts`

### Remove from `contexts/data-context.tsx`

All cotações state and methods: `cotacoes`, `addCotacao`, `updateCotacao`, `getCotacoesByPaciente`, cotações-related `getStats` fields.

### Update `types/index.ts`

Replace `Cotacao` and `ItemCotacao` interfaces. Keep `StatusCotacao` enum only if still referenced by historico mocks; remove from cotações UI model.

### Update `components/shared/status-badge.tsx`

Cotação type: badge for `ativo`/`inativo` only. Remove pendente/valida/expirada from cotação badge mapping.

## Error Handling

| Case | UX |
|------|-----|
| 403 on write | "Apenas gestor pode realizar esta ação" |
| Delete with vínculos | Show propostas + itens counts from API response |
| Empty list | `Empty` component + "Nova Cotação" CTA (gestor) |
| Form validation | Require header fields + ≥ 1 item before submit |
| Network errors | `getFriendlyApiError` in service, `Alert` on page |

## Files to Create

| File | Responsibility |
|------|----------------|
| `services/cotacoes-service.ts` | API calls, DTO mappers, item CRUD |
| `hooks/use-usuario.ts` | Current user from JWT cookie |
| `lib/cotacoes-utils.ts` | `isCotacaoVencida` helper |

## Files to Modify

| File | Change |
|------|--------|
| `hooks/use-cotacoes.ts` | API-backed queries + mutations |
| `types/index.ts` | New Cotacao/ItemCotacao types |
| `app/cotacoes/page.tsx` | Full list page rewrite |
| `app/cotacoes/nova/page.tsx` | Layout guard update |
| `app/cotacoes/[id]/page.tsx` | API detail, remove workflow |
| `app/cotacoes/[id]/editar/page.tsx` | API load |
| `components/cotacoes/cotacao-form.tsx` | Simplified form + API submit |
| `components/pacientes/paciente-cotacoes.tsx` | useCotacoes, no Context |
| `components/shared/status-badge.tsx` | ativo/inativo for cotações |
| `app/dashboard/page.tsx` | API-backed cotacao stats |
| `app/relatorios/page.tsx` | Minimal cotacao metrics |
| `contexts/data-context.tsx` | Remove cotacoes slice |
| `mocks/index.ts` | Remove cotacoes export |

## Out of Scope

- API changes (backend is source of truth as-is)
- `cotacao_propostas` CRUD (no API module)
- Approval workflow (rascunho → enviada → aprovada)
- Supplier/product/price fields on items
- React Context usage in cotações modules
- Full relatorios redesign (only cotacao metrics adjusted)

## Verification (playwright-cli)

Credentials: `gestor@email.com` / `123`

1. Login → navigate to `/cotacoes`
2. Create cotação: paciente + área + descrição + data validade + 2 itens
3. Verify list row and detail page
4. Edit: change descrição and one item
5. Toggle inativar → badge shows Inativa
6. Toggle reativar → badge shows Ativa
7. Attempt delete with items → vínculos error message
8. Open patient detail → Cotações tab shows linked cotação
9. Dashboard shows correct total and vencidas count

## API Reference (existing)

Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`)

Auth: `Authorization: Bearer <token>` from cookie `sig-lbcc-token`.

Key backend constraints:
- Write operations on `/cotacoes` require `perfil === 'gestor'`
- `PATCH /cotacoes/:id/status` toggles `ativo` (body ignored)
- `DELETE /cotacoes/:id` blocked when `cotacao_itens` or `cotacao_propostas` exist
- Item CRUD on `/cotacao-itens` has no role restriction (any authenticated user)
