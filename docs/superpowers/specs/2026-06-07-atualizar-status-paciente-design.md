# RF_F2 — Atualizar Status do Paciente (Design Spec)

**Date:** 2026-06-07  
**Status:** Approved  
**Scope:** `web/` frontend integration with existing `api/` endpoint  
**Test user:** `gestor@email.com` / `123`

## Summary

Wire the existing patient status UI in `web/` to the real RF_F2 API endpoint (`PATCH /pacientes/:id/status`), remove patient mocks, migrate affected pages off `useData`, and fix existing bugs (wrong endpoint, status mapping, form resetting status on edit). Status values are **ativo / suspenso / encerrado** (ERS layer). Transitions are free — any status can change to any other. Write permission: **operador + gestor** (UI only; API enforcement out of scope).

## Decisions

| Topic | Decision |
|-------|----------|
| Data source | API only — remove `mocks/pacientes.ts` |
| Endpoint | `PATCH /pacientes/:id/status` with `{ status: "ativo" \| "suspenso" \| "encerrado" }` |
| Status model | ERS enum: ativo, suspenso, encerrado (API maps suspenso↔inativo, encerrado↔alta/obito in DB) |
| Transitions | Free — select always shows all 3 options |
| Architecture | Approach 1: `pacientes-service.ts` + expanded `use-pacientes.ts` + `lib/pacientes-utils.ts` |
| Routes | Keep existing: `/pacientes`, `/pacientes/[id]`, `/pacientes/[id]/editar` |
| State management | Service → React Query hook → pages; **no `useData`** in paciente status modules |
| Write permissions | Operador + gestor via `useUsuario().podeAlterarStatusPaciente` |
| API changes | Out of scope — no auth enforcement, Swagger, or PUT bypass fixes |
| Form status field | Create: `status: "ativo"`; Edit: **omit `status` from PUT payload** |
| Historico | Automatic on backend (`ALTERACAO_STATUS`); frontend invalidates `["historico", id]` |

## Architecture

```
app/pacientes/[id]/*, dashboard, relatorios
    ↓
hooks/use-pacientes.ts
  ├── usePacientes()        → list + stats
  └── usePaciente(id)       → detail + alterarStatus mutation
    ↓
hooks/use-usuario.ts        → podeAlterarStatusPaciente
    ↓
lib/pacientes-utils.ts      → mappers + computePacienteStats
    ↓
services/pacientes-service.ts
  └── alterarStatusPaciente(id, status) → PATCH /pacientes/:id/status
    ↓
API
```

### Cross-invalidation

On status change, invalidate:

- `["pacientes"]`
- `["pacientes", id]`
- `["historico", id]`

Query keys: `["pacientes"]` (list), `["pacientes", id]` (detail).

## Data Model

### Status mapping (API ERS ↔ UI `StatusPaciente`)

| API response (ERS) | UI enum | DB value (write) |
|--------------------|---------|------------------|
| `ativo` | `StatusPaciente.ATIVO` | `ativo` |
| `suspenso` | `StatusPaciente.SUSPENSO` | `inativo` |
| `encerrado` | `StatusPaciente.ENCERRADO` | `alta` (read also maps `obito` → encerrado) |

### PATCH request body

Send ERS values directly — no DB mapping on the frontend:

```json
{ "status": "ativo" | "suspenso" | "encerrado" }
```

### Utility: `lib/pacientes-utils.ts`

```typescript
mapApiStatusToStatusPaciente(status: string | null | undefined): StatusPaciente
// inativo | suspenso → SUSPENSO; alta | obito | encerrado → ENCERRADO; default ATIVO

mapApiPacienteToPaciente(dto: ApiPacienteDTO): Paciente

computePacienteStats(pacientes: Paciente[]): {
  totalPacientes: number
  pacientesAtivos: number
  pacientesSuspensos: number
  pacientesEncerrados: number
}
```

**Bug fix:** `use-pacientes.ts` currently maps `inativo` → `ENCERRADO`; centralized mapper corrects to `SUSPENSO`.

## Service Layer (`services/pacientes-service.ts`)

Add to existing file (follow `alternarStatusCotacao` pattern):

| Function | HTTP | Path | Body |
|----------|------|------|------|
| `alterarStatusPaciente(id, status)` | PATCH | `/pacientes/:id/status` | `{ status }` |

- Returns `ApiPacienteDTO` (status already in ERS)
- Error via `getFriendlyApiError`
- `atualizarPaciente` (PUT) remains for cadastro edits — **must not include `status` on edit**

## Hook Layer (`hooks/use-pacientes.ts`)

### `usePacientes()` — refactor

Import mappers from `lib/pacientes-utils.ts`. External API unchanged: `pacientes`, `isLoading`, `error`, `refetch`.

### `usePaciente(id)` — new (mirrors `useCotacao(id)`)

| Export | Description |
|--------|-------------|
| `paciente` | `Paciente \| null` |
| `isLoading`, `error`, `refetch` | Query state |
| `alterarStatus(status)` | `useMutation` → `alterarStatusPaciente` |
| `isAlterandoStatus` | Mutation pending |

Query: `useQuery({ queryKey: ["pacientes", id], queryFn: () => obterPaciente(id).then(map) })`

### `hooks/use-usuario.ts`

Add:

```typescript
podeAlterarStatusPaciente: perfil === PerfilUsuario.OPERADOR || perfil === PerfilUsuario.GESTOR
```

Used in `pacientes/[id]/page.tsx` instead of `useAuth().podeAlterarStatus`.

## Pages & Components

### `components/pacientes/alterar-status-modal.tsx`

| Before | After |
|--------|-------|
| `useData().alterarStatusPaciente` | `usePaciente(pacienteId).alterarStatus` |
| `useAuth().usuario` (nome ignored by API) | Remove |
| Manual `isSubmitting` | `isAlterandoStatus` from hook |

Props unchanged: `{ pacienteId, statusAtual }`. Dialog UX unchanged: select 3 statuses, confirm disabled when same status, error `Alert` on failure. Modal closes on success; badge refreshes via query invalidation.

### `app/pacientes/[id]/page.tsx`

Replace `useData` + local `useState` + `useEffect` with `usePaciente(id)`:

- Loading/error/notFound from query
- `StatusBadge` reads live `paciente.status`
- `AlterarStatusModal` gated by `useUsuario().podeAlterarStatusPaciente`
- Remove imports: `useData`, `useAuth`

### `app/pacientes/[id]/editar/page.tsx`

Same migration: `usePaciente(id)` for load. Remove `useData` + manual fetch effect.

### `components/pacientes/paciente-form.tsx`

- **Create:** keep `status: "ativo"` in POST payload
- **Edit:** remove `status` from PUT payload (fixes bug resetting suspended/closed patients to ativo)
- Invalidate `["pacientes"]` and `["pacientes", id]` on update success

### `app/dashboard/page.tsx`

Replace `useData().getStats()` with:

```typescript
const { pacientes } = usePacientes()
const { totalPacientes, pacientesAtivos, pacientesSuspensos, pacientesEncerrados } =
  computePacienteStats(pacientes)
```

Remove `useData` import. Cotações and atendimentos stats unchanged (already on hooks).

### `app/relatorios/page.tsx`

Replace `useData().pacientes` with `usePacientes().pacientes`. Use `StatusPaciente` enum in filters instead of raw strings. Pie chart and summary cards reflect live API data.

### Unchanged

| File | Reason |
|------|--------|
| `app/pacientes/page.tsx` | Already uses `usePacientes()` |
| `components/shared/status-badge.tsx` | Already supports 3 patient statuses |
| `components/pacientes/paciente-historico.tsx` | Already reads `ALTERACAO_STATUS` from API |

## Permissions

| Action | API rule (today) | UI rule |
|--------|------------------|---------|
| View patient / status badge | Any authenticated | `PERFIS_DASHBOARD_PACIENTES` via layout |
| Alterar status | Any authenticated (no role check) | Operador + gestor only; prefeitura sees badge but no button |

API enforcement alignment is out of scope.

## Mock & Context Cleanup

### Delete

- `mocks/pacientes.ts`
- Export `pacientesMock` from `mocks/index.ts`

### Remove from `contexts/data-context.tsx`

- `alterarStatusPaciente` function, type entry, and provider value
- `mapStatusPacienteToApiStatus` if no longer referenced after form fix

Keep remaining Context slices (fornecedores, produtos, documentos, etc.) — out of scope.

## Error Handling

| Case | UX |
|------|-----|
| Invalid status (400) | Destructive `Alert` in modal with API message |
| Patient not found | Query error → error state or `notFound()` |
| Network error | `getFriendlyApiError` in service |
| Same status selected | Confirm button disabled (existing behavior) |
| Status change success | Modal closes; badge + historico tab refresh via invalidation |

## Files to Create

| File | Responsibility |
|------|----------------|
| `lib/pacientes-utils.ts` | Status/patient mappers, `computePacienteStats` |

## Files to Modify

| File | Change |
|------|--------|
| `services/pacientes-service.ts` | Add `alterarStatusPaciente` |
| `hooks/use-pacientes.ts` | Refactor mappers + add `usePaciente(id)` |
| `hooks/use-usuario.ts` | Add `podeAlterarStatusPaciente` |
| `components/pacientes/alterar-status-modal.tsx` | Rewire to hook |
| `components/pacientes/paciente-form.tsx` | Omit status on edit; invalidate queries |
| `app/pacientes/[id]/page.tsx` | Migrate off `useData` |
| `app/pacientes/[id]/editar/page.tsx` | Migrate off `useData` |
| `app/dashboard/page.tsx` | `usePacientes` + `computePacienteStats` |
| `app/relatorios/page.tsx` | `usePacientes` |
| `contexts/data-context.tsx` | Remove `alterarStatusPaciente` |
| `mocks/index.ts` | Remove pacientes export |

## Out of Scope

- API changes (auth enforcement, PUT bypass block, Swagger fix, tests)
- Transition rules in UI
- Motivo/observação field on status change modal
- `paciente-documentos.tsx` migration off Context
- Full `data-context.tsx` removal
- Automated tests

## Verification (manual)

Credentials: `gestor@email.com` / `123`

1. Open active patient detail → Alterar Status → Suspenso → badge updates immediately
2. Histórico tab → `ALTERACAO_STATUS` entry appears
3. Change back to Ativo → free transition works
4. Set Encerrado → badge shows Encerrado (not Suspenso — validates PATCH endpoint fix)
5. Edit closed patient → save form → status remains Encerrado
6. Dashboard status cards reflect updated counts
7. Relatórios pie chart reflects updated distribution
8. `/pacientes` list filter by status works correctly
9. Prefeitura user (if available) → Alterar Status button hidden

## API Reference (existing)

Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`)

Auth: `Authorization: Bearer <token>` from cookie `sig-lbcc-token`.

### RF_F2 endpoint

```
PATCH /pacientes/:id/status
Body: { "status": "ativo" | "suspenso" | "encerrado" }
Response 200: ApiPacienteDTO (status in ERS)
```

Side effect: auto-inserts `historico_pacientes` with `tipo_evento: ALTERACAO_STATUS`.

### Known API gaps (documented, not fixed in this scope)

- Swagger documents gestor-only 403; API allows any authenticated user
- `PUT /pacientes/:id` accepts `status` without RF_F2 rules or historico
- No transition validation on backend
- `encerrado` always writes `alta` to DB (never `obito`)
