# RF_F1 — Registrar Atendimento no Histórico (Design Spec)

**Date:** 2026-06-07  
**Status:** Approved  
**Scope:** `web/` frontend integration with existing `api/` endpoints  
**Test user:** `gestor@email.com` / `123`

## Summary

Wire the existing atendimentos UI in `web/` to the real API (`/atendimentos`), migrate the patient **Atendimentos** and **Histórico** tabs to live data (`/historico-pacientes`), remove all related mocks, and align the data model with what the backend exposes today. Creating an atendimento via `POST /atendimentos` automatically writes to `historico_pacientes` on the backend — no separate historico write from the frontend.

## Decisions

| Topic | Decision |
|-------|----------|
| Scope | Módulo Atendimentos + aba Atendimentos do paciente + aba Histórico |
| Data source | API only — remove atendimentos and historico mocks |
| Status workflow | Removed — API has no `status` field |
| Form fields | Minimum: paciente, tipo, data, descrição |
| Architecture | Approach 1: `atendimentos-service.ts` + `historico-service.ts` + dedicated hooks |
| Routes | Keep existing: `/atendimentos`, `/novo`, `/[id]`, `/[id]/editar` |
| State management | Service → React Query hook → pages; **no Context** in atendimentos/historico modules |
| Write permissions | Create/edit: any authenticated user (matches API); delete: gestor only |
| Historico display | Map `tipo_evento` → visual category (icon/color); link to atendimento via `referencia_id` |

## Architecture

```
app/atendimentos/*
    ↓
hooks (use-atendimentos, use-pacientes, use-usuario)
    ↓
services/atendimentos-service.ts → services/api.ts
    ↓
API (/atendimentos)

app/pacientes/[id] (tabs)
    ├── paciente-atendimentos → use-atendimentos (client-side filter by pacienteId)
    └── paciente-historico    → use-historico(pacienteId)
                                    ↓
                            services/historico-service.ts
                                    ↓
                            API (/historico-pacientes?paciente_id=)
```

### Cross-invalidation

On atendimento create/update/delete, invalidate:

- `["atendimentos"]`
- `["historico", pacienteId]` (from mutation input or loaded record)

## Data Model

### `Atendimento` (replaces current interface)

| UI field (camelCase) | API field | Required (form) | Notes |
|---------------------|-----------|-----------------|-------|
| `id` | `id` | — | UUID |
| `pacienteId` | `paciente_id` | yes | FK |
| `tipo` | `tipo` | yes | Enum (see below) |
| `dataAtendimento` | `data_atendimento` | yes | ISO date `YYYY-MM-DD` |
| `descricao` | `descricao` | yes | Free text |
| `criadoEm` | `created_at` | — | |
| `atualizadoEm` | `updated_at` | — | Present after edit |
| `pacienteNome` | `pacientes.nome` | — | From API join |
| `criadoPorNome` | via `created_by` join | — | Display if join available |

### `TipoAtendimento` enum (aligned with API Swagger)

`consulta`, `exame`, `procedimento`, `internacao`, `quimioterapia`, `radioterapia`, `outro`

Labels for UI (Portuguese):

| Value | Label |
|-------|-------|
| `consulta` | Consulta |
| `exame` | Exame |
| `procedimento` | Procedimento |
| `internacao` | Internação |
| `quimioterapia` | Quimioterapia |
| `radioterapia` | Radioterapia |
| `outro` | Outro |

### `HistoricoPaciente` (replaces `Historico` mock interface)

| UI field (camelCase) | API field | Notes |
|---------------------|-----------|-------|
| `id` | `id` | UUID |
| `pacienteId` | `paciente_id` | FK |
| `tipoEvento` | `tipo_evento` | UPPER_SNAKE from API |
| `descricao` | `descricao` | Event description |
| `referenciaId` | `referencia_id` | Links to atendimento/cotacao when present |
| `criadoEm` | `created_at` | Timeline timestamp |
| `usuarioNome` | `usuarios.nome` | From API join |

### Removed from frontend model

`status`, `dataHora`, `areaId`, `areaAtendimentoId`, `tipoAtendimento`, `cotacaoId`, `observacoes`, `responsavelId`, workflow buttons (Agendar/Iniciar/Concluir/Cancelar), mock `TipoEvento` enum usage in historico tab.

### Input types

```typescript
interface AtendimentoCreateInput {
  pacienteId: string;
  tipo: TipoAtendimento;
  dataAtendimento: string;
  descricao: string;
}

type AtendimentoUpdateInput = AtendimentoCreateInput;
```

### Utility: `lib/historico-utils.ts`

```typescript
type HistoricoCategoria = 'atendimento' | 'status' | 'cotacao' | 'documento' | 'outro';

getHistoricoCategoria(tipoEvento: string): HistoricoCategoria
// ATENDIMENTO, ATENDIMENTO_REGISTRADO, ATENDIMENTO_REMOVIDO → atendimento
// ALTERACAO_STATUS → status
// COTACAO_CRIADA, COTACAO_EDITADA → cotacao
// DOCUMENTO_ANEXADO, DOCUMENTO_REMOVIDO → documento
// unknown → outro

getHistoricoLink(referenciaId: string | null, tipoEvento: string): string | null
// atendimento category → /atendimentos/:referenciaId
// cotacao category → /cotacoes/:referenciaId
// otherwise → null

getHistoricoCategoriaConfig(categoria: HistoricoCategoria): { icon, colorClass, label }
```

### Utility: `lib/atendimentos-utils.ts`

```typescript
getTipoAtendimentoLabel(tipo: string): string
formatDataAtendimento(dataAtendimento: string): string  // dd/MM/yyyy
```

## Service Layer

Follow `services/cotacoes-service.ts` pattern: DTO types, mappers, `getFriendlyApiError`.

### `services/atendimentos-service.ts`

| Function | HTTP | Path |
|----------|------|------|
| `listarAtendimentos()` | GET | `/atendimentos` |
| `obterAtendimento(id)` | GET | `/atendimentos/:id` |
| `criarAtendimento(dados)` | POST | `/atendimentos` |
| `atualizarAtendimento(id, dados)` | PUT | `/atendimentos/:id` |
| `excluirAtendimento(id)` | DELETE | `/atendimentos/:id` |

**POST body (snake_case):**

```json
{
  "paciente_id": "uuid",
  "tipo": "consulta",
  "data_atendimento": "2026-06-07",
  "descricao": "Descrição do atendimento"
}
```

**DTO join shape:**

```typescript
interface ApiAtendimentoDTO {
  id: string;
  paciente_id: string;
  tipo: string;
  data_atendimento: string;
  descricao: string;
  created_at: string;
  updated_at?: string | null;
  created_by?: string | null;
  pacientes?: { id: string; nome: string } | null;
}
```

### `services/historico-service.ts`

| Function | HTTP | Path |
|----------|------|------|
| `listarHistoricoPaciente(pacienteId)` | GET | `/historico-pacientes?paciente_id=` |

**DTO join shape:**

```typescript
interface ApiHistoricoPacienteDTO {
  id: string;
  paciente_id: string;
  tipo_evento: string;
  descricao: string;
  referencia_id?: string | null;
  created_at: string;
  usuarios?: { id: string; nome: string; email: string } | null;
}
```

### Create flow

1. POST `/atendimentos` with `{ paciente_id, tipo, data_atendimento, descricao }`
2. Backend auto-inserts `historico_pacientes` row (`tipo_evento: 'ATENDIMENTO'`, `referencia_id: <new id>`)
3. Invalidate `["atendimentos"]` and `["historico", pacienteId]`
4. Redirect: if `?pacienteId=` was present → `/pacientes/:pacienteId`; otherwise → `/atendimentos/:id`

### Edit flow

1. PUT `/atendimentos/:id` with changed fields
2. Backend writes historico entry (`tipo_evento: 'ALTERACAO_STATUS'`, descricao `'Atendimento atualizado'`)
3. Invalidate both query keys
4. Redirect to `/atendimentos/:id`

### Delete flow

1. DELETE `/atendimentos/:id` (gestor only)
2. Backend writes historico entry (`tipo_evento: 'ATENDIMENTO_REMOVIDO'`)
3. Invalidate both query keys
4. Redirect to `/atendimentos`

## Hook Layer

### `hooks/use-atendimentos.ts`

- `useQuery` key `["atendimentos"]` → `listarAtendimentos` + map to domain
- `useQuery` key `["atendimentos", id]` → `obterAtendimento` (for detail/edit pages)
- Mutations: `criarAtendimento`, `atualizarAtendimento`, `excluirAtendimento`
- On mutation success: invalidate `["atendimentos"]` and `["historico", pacienteId]`
- Expose: `atendimentos`, `isLoading`, `error`, `refetch`, mutation helpers + `isMutating` flags

### `hooks/use-historico.ts`

- `useQuery` key `["historico", pacienteId]` → `listarHistoricoPaciente`
- `enabled: !!pacienteId`
- Read-only — no mutations
- Expose: `historico`, `isLoading`, `error`, `refetch`

## Pages & Components

### List (`app/atendimentos/page.tsx`)

Mirror `app/cotacoes/page.tsx` structure:

**Columns:** Data, Paciente, Tipo, Descrição, Actions.

**Filters:** Search (paciente nome, descrição) + tipo filter (todos / per enum value).

**Actions:** Ver (all), Editar (all), Excluir (gestor, `AlertDialog`).

**States:** `TableLoading`, destructive `Alert` + retry, `Empty` with "Novo Atendimento" CTA.

Remove: status filter, status badge column, area column, `ProtectedRoute` wrapper, `useData`.

Use `DashboardLayout` with `allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}`.

Client-side sort: `dataAtendimento` descending.

### Form (`components/atendimentos/atendimento-form.tsx`)

**Fields:**

- Paciente — `Select` via `usePacientes`, active patients only
- Tipo — `Select` with `TipoAtendimento` enum labels
- Data — `Input type="date"`, defaults to today
- Descrição — `Textarea`, required

**Single submit:** "Salvar".

**Pre-fill:** `?pacienteId=` query param from patient tab link; disable paciente select when pre-filled (optional UX enhancement).

**Redirect after save:**

- If `?pacienteId=` present → `/pacientes/:pacienteId`
- Otherwise → `/atendimentos/:id`

Remove: área, observações, datetime-local, status buttons, `useData`, `useAuth`. Use `useAtendimentos` mutations.

### Detail (`app/atendimentos/[id]/page.tsx`)

Read-only cards: paciente (link to `/pacientes/:id`), tipo (label), data, descrição, metadata (criado em, atualizado em).

Remove: Concluir/Cancelar actions, StatusBadge, area/responsavel cards, `useData`.

**Actions:** Editar (all), Excluir (gestor, `AlertDialog`).

Load via `useAtendimento(id)` or dedicated query in page.

### Edit (`app/atendimentos/[id]/editar/page.tsx`)

Load via `obterAtendimento(id)`; render `AtendimentoForm` with `isEditing`.

### New (`app/atendimentos/novo/page.tsx`)

Render `AtendimentoForm`; update layout guard to `DashboardLayout` + `allowedRoles`.

### Patient tab — Atendimentos (`components/pacientes/paciente-atendimentos.tsx`)

Replace `useData` with `useAtendimentos()`; filter `atendimentos.filter(a => a.pacienteId === pacienteId)`.

**Columns:** Data, Tipo, Descrição, Actions (Ver → `/atendimentos/:id`).

**CTA:** "Novo Atendimento" → `/atendimentos/novo?pacienteId=${pacienteId}` (visible to all authenticated — matches API).

Remove: area column, cotação column, `getAreaById`.

States: loading skeleton or `TableLoading`, error `Alert`, `Empty`.

### Patient tab — Histórico (`components/pacientes/paciente-historico.tsx`)

Replace `useData` with `useHistorico(pacienteId)`.

Keep timeline layout; map categories via `historico-utils`.

Each entry shows: descrição, tipo label, timestamp, usuario nome.

When `getHistoricoLink()` returns a path, show "Ver detalhes" link.

Remove: mock `TipoEvento` enum, `useData`.

States: loading, error, empty.

### Dashboard (`app/dashboard/page.tsx`)

Replace `getStats().totalAtendimentos` with `useAtendimentos().atendimentos.length`.

### Reports (`app/relatorios/page.tsx`)

Replace `useData().atendimentos` with `useAtendimentos()` for atendimento counts/metrics. Minimal update — remove mock dependency only.

## Permissions

| Action | API rule | UI rule |
|--------|----------|---------|
| List / view | Any authenticated | `ROLES_ATENDIMENTOS_E_COTACOES` via layout |
| Create / edit | Any authenticated | Show buttons to all users in module |
| Delete | Gestor only | Hide when `!isGestor` via `useUsuario`; API 403 as fallback |

## Mock & Context Cleanup

### Delete

- `mocks/atendimentos.ts`
- `mocks/historico.ts`
- Exports from `mocks/index.ts`

### Remove from `contexts/data-context.tsx`

All atendimentos and historico state and methods:

- `atendimentos`, `historico` state
- `getAtendimentoById`, `getAtendimentosByPaciente`, `addAtendimento`, `updateAtendimento`
- `getHistoricoByPaciente`, `addHistorico`
- `totalAtendimentos` from `getStats`
- `atendimentos` check in `deleteArea` guard (areas module uses `useAreas` API independently — remove mock-based guard)

### Update `types/index.ts`

- Replace `Atendimento` interface
- Add `HistoricoPaciente`, `TipoAtendimento`, `AtendimentoCreateInput`, `AtendimentoUpdateInput`
- Remove or deprecate mock `Historico` interface and `TipoEvento` enum if no longer referenced
- Update `FiltroAtendimento` — remove `areaId`; keep `pacienteId`, `tipo`, `periodoInicio`, `periodoFim`

## Error Handling

| Case | UX |
|------|-----|
| 403 on delete | "Apenas gestor pode realizar esta ação" |
| 400 on create (missing fields) | Show API message via `getFriendlyApiError` |
| 404 on detail | `notFound()` |
| Empty list | `Empty` component + "Novo Atendimento" CTA |
| Form validation | Require paciente, tipo, data, descrição before submit |
| Network errors | `getFriendlyApiError` in service, `Alert` on page |
| Historico load failure | `Alert` in historico tab with retry |

## Files to Create

| File | Responsibility |
|------|----------------|
| `services/atendimentos-service.ts` | API calls, DTO mappers, CRUD |
| `services/historico-service.ts` | API calls, DTO mappers, list by paciente |
| `hooks/use-atendimentos.ts` | React Query for atendimentos CRUD |
| `hooks/use-historico.ts` | React Query for historico (read-only) |
| `lib/historico-utils.ts` | Category mapping, links, icon config |
| `lib/atendimentos-utils.ts` | Tipo labels, date formatting |

## Files to Modify

| File | Change |
|------|--------|
| `types/index.ts` | New Atendimento/HistoricoPaciente types |
| `app/atendimentos/page.tsx` | API-backed list, no status |
| `app/atendimentos/novo/page.tsx` | Layout guard, no Context |
| `app/atendimentos/[id]/page.tsx` | API detail, remove workflow |
| `app/atendimentos/[id]/editar/page.tsx` | API load |
| `components/atendimentos/atendimento-form.tsx` | Minimal form + API submit |
| `components/pacientes/paciente-atendimentos.tsx` | useAtendimentos, no Context |
| `components/pacientes/paciente-historico.tsx` | useHistorico, category mapping |
| `app/dashboard/page.tsx` | API-backed atendimento count |
| `app/relatorios/page.tsx` | Remove mock atendimentos dependency |
| `contexts/data-context.tsx` | Remove atendimentos + historico slices |
| `mocks/index.ts` | Remove atendimentos + historico exports |

## Out of Scope

- API changes (backend is source of truth as-is)
- Adding `status` workflow to API or frontend
- Form fields: área, cotação, local, profissional, acompanhante, transporte, observações
- Server-side filter `?paciente_id=` on `/atendimentos` (client-side filter instead)
- Migrating `app/pacientes/[id]/page.tsx` patient load from `useData` to `usePacientes`
- React Context usage in atendimentos/historico modules
- Atomic historico writes on backend
- API tests for atendimentos/historico modules
- Full relatorios redesign (only atendimento mock dependency removed)

## Known API Gaps (documented, non-blocking)

| Gap | Impact | Mitigation |
|-----|--------|------------|
| No `?paciente_id=` on `GET /atendimentos` | List all, filter client-side | Filter in hook/component |
| Historico insert may fail silently on create | Timeline missing entry | Accept current API behavior |
| Patient registration does not write historico | Timeline may start empty | Expected until first atendimento |
| Cotações do not auto-write historico | `COTACAO_*` events rare/absent | Map tipo if present in DB |
| `tipo_evento` inconsistency (`ATENDIMENTO` vs `ATENDIMENTO_REGISTRADO`) | Both mapped to same category | `historico-utils` handles both |
| Update historico uses `ALTERACAO_STATUS` | Generic label for edits | Display API `descricao` as-is |

## Verification (playwright-cli)

Credentials: `gestor@email.com` / `123`

Prerequisites: API running (`http://localhost:3000`), web running (`http://localhost:3001`).

1. Login → navigate to `/atendimentos`
2. Verify list loads from API (not mock IDs like `atend-001`)
3. Create atendimento: paciente + tipo + data + descrição → verify detail page
4. Open patient detail (`/pacientes/:id`) → **Atendimentos** tab shows new record
5. Same patient → **Histórico** tab shows `ATENDIMENTO` event with link to atendimento
6. Edit atendimento → verify update on detail and list
7. Delete atendimento (gestor) → verify removed from list; historico shows `ATENDIMENTO_REMOVIDO`
8. From patient tab, click "Novo Atendimento" → form pre-fills paciente
9. Dashboard shows correct `totalAtendimentos` count

## API Reference (existing)

Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`)

Auth: `Authorization: Bearer <token>` from cookie `sig-lbcc-token`.

### Atendimentos

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/atendimentos` | Authenticated | Returns all with joins |
| GET | `/atendimentos/:id` | Authenticated | Single record |
| POST | `/atendimentos` | Authenticated | Required: `paciente_id`, `tipo`, `data_atendimento`, `descricao` |
| PUT | `/atendimentos/:id` | Authenticated | Any non-empty body |
| DELETE | `/atendimentos/:id` | Gestor | Writes `ATENDIMENTO_REMOVIDO` historico |

### Histórico

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/historico-pacientes?paciente_id=` | Authenticated | Ordered by `created_at` desc |
| GET | `/historico-pacientes/:id` | Authenticated | Single record |
| POST | `/historico-pacientes` | Authenticated | Manual entry — not used by frontend in this RF |
| DELETE | `/historico-pacientes/:id` | Gestor | Not exposed in UI |

### Auto-historico on atendimento create (backend)

```javascript
{
  paciente_id,
  tipo_evento: 'ATENDIMENTO',
  descricao,           // same as atendimento descricao
  referencia_id: <new atendimento id>,
  usuario_id: req.user.id
}
```
