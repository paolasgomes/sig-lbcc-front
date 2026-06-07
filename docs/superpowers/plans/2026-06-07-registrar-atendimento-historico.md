# RF_F1 — Registrar Atendimento no Histórico Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the atendimentos UI and patient Atendimentos/Histórico tabs to the real API, remove mocks, and align the data model with the backend (no status workflow).

**Architecture:** `atendimentos-service.ts` and `historico-service.ts` handle DTO mapping and HTTP; `use-atendimentos.ts` and `use-historico.ts` expose React Query queries/mutations; pages consume hooks directly (no Context). Mutations invalidate both `["atendimentos"]` and `["historico", pacienteId]`.

**Tech Stack:** Next.js 16, React 19, TanStack Query v5, Axios, TypeScript, Vitest (already configured), Playwright CLI (E2E verification per spec).

**Spec:** `web/docs/superpowers/specs/2026-06-07-registrar-atendimento-historico-design.md`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `types/index.ts` | New `Atendimento`, `HistoricoPaciente`, `TipoAtendimento`, input types |
| `lib/atendimentos-utils.ts` | Tipo labels, date formatting |
| `lib/atendimentos-utils.test.ts` | Unit tests for utils |
| `lib/historico-utils.ts` | Category mapping, links, icon/color config |
| `lib/historico-utils.test.ts` | Unit tests for historico utils |
| `services/atendimentos-service.ts` | API calls, DTO mappers, CRUD |
| `services/atendimentos-service.test.ts` | Mapper unit tests |
| `services/historico-service.ts` | API calls, DTO mappers, list by paciente |
| `services/historico-service.test.ts` | Mapper unit tests |
| `hooks/use-atendimentos.ts` | React Query list/detail + mutations |
| `hooks/use-historico.ts` | React Query read-only historico |
| `app/atendimentos/page.tsx` | API-backed list, tipo filter, gestor delete |
| `components/atendimentos/atendimento-form.tsx` | Minimal form + API submit |
| `app/atendimentos/novo/page.tsx` | Layout guard update |
| `app/atendimentos/[id]/page.tsx` | Read-only detail + gestor delete |
| `app/atendimentos/[id]/editar/page.tsx` | API load |
| `components/pacientes/paciente-atendimentos.tsx` | Patient tab via `useAtendimentos` |
| `components/pacientes/paciente-historico.tsx` | Patient tab via `useHistorico` |
| `app/dashboard/page.tsx` | API-backed atendimento count |
| `app/relatorios/page.tsx` | Swap mock atendimentos for `useAtendimentos` |
| `components/pacientes/paciente-form.tsx` | Remove mock `addHistorico` calls |
| `contexts/data-context.tsx` | Remove atendimentos + historico slices |
| `mocks/atendimentos.ts` | **Delete** |
| `mocks/historico.ts` | **Delete** |
| `mocks/index.ts` | Remove atendimentos + historico exports |

---

### Task 1: Update `types/index.ts`

**Files:**
- Modify: `web/types/index.ts`

Replace the old `Atendimento` interface and add historico types. Remove mock-only `Historico` interface and `TipoEvento` enum (only used by mocks and components being migrated). Update `FiltroAtendimento` and `DashboardStats`.

- [ ] **Step 1: Replace Atendimento block and add new types**

Remove lines 67–74 (`TipoEvento` enum), 257–273 (old `Atendimento`), 275–282 (old `Historico`). Insert after `CotacaoUpdateInput`:

```typescript
export type TipoAtendimento =
  | "consulta"
  | "exame"
  | "procedimento"
  | "internacao"
  | "quimioterapia"
  | "radioterapia"
  | "outro";

export const TIPOS_ATENDIMENTO: TipoAtendimento[] = [
  "consulta",
  "exame",
  "procedimento",
  "internacao",
  "quimioterapia",
  "radioterapia",
  "outro",
];

export interface Atendimento {
  id: string;
  pacienteId: string;
  tipo: TipoAtendimento;
  dataAtendimento: string;
  descricao: string;
  criadoEm: string;
  atualizadoEm?: string;
  pacienteNome?: string;
  criadoPorNome?: string;
}

export interface HistoricoPaciente {
  id: string;
  pacienteId: string;
  tipoEvento: string;
  descricao: string;
  referenciaId?: string | null;
  criadoEm: string;
  usuarioNome?: string;
}

export interface AtendimentoCreateInput {
  pacienteId: string;
  tipo: TipoAtendimento;
  dataAtendimento: string;
  descricao: string;
}

export type AtendimentoUpdateInput = AtendimentoCreateInput;
```

- [ ] **Step 2: Update filter and form types**

Replace `AtendimentoFormData` and `FiltroAtendimento`:

```typescript
export type AtendimentoFormData = AtendimentoCreateInput;

export interface FiltroAtendimento {
  pacienteId?: string;
  tipo?: TipoAtendimento;
  periodoInicio?: string;
  periodoFim?: string;
}
```

Keep `DashboardStats.totalAtendimentos` — dashboard will populate it from API count.

- [ ] **Step 3: Verify TypeScript (expect failures in unmigrated files)**

Run: `cd web && npx tsc --noEmit 2>&1 | head -30`
Expected: errors in atendimentos pages/components still using old fields — proceed to next tasks

- [ ] **Step 4: Commit**

```bash
git add types/index.ts
git commit -m "refactor: align atendimento and historico types with api"
```

---

### Task 2: `lib/atendimentos-utils.ts`

**Files:**
- Create: `web/lib/atendimentos-utils.ts`
- Create: `web/lib/atendimentos-utils.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// web/lib/atendimentos-utils.test.ts
import { describe, it, expect } from "vitest";
import { getTipoAtendimentoLabel, formatDataAtendimento } from "./atendimentos-utils";

describe("getTipoAtendimentoLabel", () => {
  it("returns Portuguese label for known tipo", () => {
    expect(getTipoAtendimentoLabel("consulta")).toBe("Consulta");
    expect(getTipoAtendimentoLabel("internacao")).toBe("Internação");
    expect(getTipoAtendimentoLabel("quimioterapia")).toBe("Quimioterapia");
  });

  it("returns raw value for unknown tipo", () => {
    expect(getTipoAtendimentoLabel("desconhecido")).toBe("desconhecido");
  });
});

describe("formatDataAtendimento", () => {
  it("formats yyyy-MM-dd to dd/MM/yyyy", () => {
    expect(formatDataAtendimento("2026-06-07")).toBe("07/06/2026");
  });

  it("returns input when date is invalid", () => {
    expect(formatDataAtendimento("invalid")).toBe("invalid");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- lib/atendimentos-utils.test.ts`
Expected: FAIL with "Cannot find module './atendimentos-utils'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// web/lib/atendimentos-utils.ts
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TipoAtendimento } from "@/types";

const TIPO_LABELS: Record<TipoAtendimento, string> = {
  consulta: "Consulta",
  exame: "Exame",
  procedimento: "Procedimento",
  internacao: "Internação",
  quimioterapia: "Quimioterapia",
  radioterapia: "Radioterapia",
  outro: "Outro",
};

export function getTipoAtendimentoLabel(tipo: string): string {
  return TIPO_LABELS[tipo as TipoAtendimento] ?? tipo;
}

export function formatDataAtendimento(dataAtendimento: string): string {
  const dateOnly = dataAtendimento.slice(0, 10);
  const parsed = parse(dateOnly, "yyyy-MM-dd", new Date());

  if (!isValid(parsed)) {
    return dataAtendimento;
  }

  return format(parsed, "dd/MM/yyyy", { locale: ptBR });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- lib/atendimentos-utils.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/atendimentos-utils.ts lib/atendimentos-utils.test.ts
git commit -m "feat: add atendimentos display utils"
```

---

### Task 3: `lib/historico-utils.ts`

**Files:**
- Create: `web/lib/historico-utils.ts`
- Create: `web/lib/historico-utils.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// web/lib/historico-utils.test.ts
import { describe, it, expect } from "vitest";
import {
  getHistoricoCategoria,
  getHistoricoLink,
  getHistoricoCategoriaConfig,
} from "./historico-utils";

describe("getHistoricoCategoria", () => {
  it("maps atendimento event types", () => {
    expect(getHistoricoCategoria("ATENDIMENTO")).toBe("atendimento");
    expect(getHistoricoCategoria("ATENDIMENTO_REGISTRADO")).toBe("atendimento");
    expect(getHistoricoCategoria("ATENDIMENTO_REMOVIDO")).toBe("atendimento");
  });

  it("maps cotacao event types", () => {
    expect(getHistoricoCategoria("COTACAO_CRIADA")).toBe("cotacao");
    expect(getHistoricoCategoria("COTACAO_EDITADA")).toBe("cotacao");
  });

  it("maps status and documento types", () => {
    expect(getHistoricoCategoria("ALTERACAO_STATUS")).toBe("status");
    expect(getHistoricoCategoria("DOCUMENTO_ANEXADO")).toBe("documento");
    expect(getHistoricoCategoria("DOCUMENTO_REMOVIDO")).toBe("documento");
  });

  it("returns outro for unknown types", () => {
    expect(getHistoricoCategoria("UNKNOWN_EVENT")).toBe("outro");
  });
});

describe("getHistoricoLink", () => {
  it("returns atendimento link for atendimento category", () => {
    expect(getHistoricoLink("uuid-1", "ATENDIMENTO")).toBe("/atendimentos/uuid-1");
  });

  it("returns cotacao link for cotacao category", () => {
    expect(getHistoricoLink("uuid-2", "COTACAO_CRIADA")).toBe("/cotacoes/uuid-2");
  });

  it("returns null when referenciaId is missing", () => {
    expect(getHistoricoLink(null, "ATENDIMENTO")).toBeNull();
  });

  it("returns null for categories without links", () => {
    expect(getHistoricoLink("uuid-3", "ALTERACAO_STATUS")).toBeNull();
  });
});

describe("getHistoricoCategoriaConfig", () => {
  it("returns label and colorClass for each category", () => {
    const config = getHistoricoCategoriaConfig("atendimento");
    expect(config.label).toBe("Atendimento");
    expect(config.colorClass).toContain("bg-");
    expect(config.icon).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- lib/historico-utils.test.ts`
Expected: FAIL with module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// web/lib/historico-utils.ts
import {
  ClipboardList,
  Activity,
  FileText,
  File,
  CircleDot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type HistoricoCategoria =
  | "atendimento"
  | "status"
  | "cotacao"
  | "documento"
  | "outro";

const ATENDIMENTO_EVENTS = new Set([
  "ATENDIMENTO",
  "ATENDIMENTO_REGISTRADO",
  "ATENDIMENTO_REMOVIDO",
]);

const COTACAO_EVENTS = new Set(["COTACAO_CRIADA", "COTACAO_EDITADA"]);

const DOCUMENTO_EVENTS = new Set(["DOCUMENTO_ANEXADO", "DOCUMENTO_REMOVIDO"]);

export function getHistoricoCategoria(tipoEvento: string): HistoricoCategoria {
  const normalized = tipoEvento.toUpperCase();

  if (ATENDIMENTO_EVENTS.has(normalized)) return "atendimento";
  if (normalized === "ALTERACAO_STATUS") return "status";
  if (COTACAO_EVENTS.has(normalized)) return "cotacao";
  if (DOCUMENTO_EVENTS.has(normalized)) return "documento";

  return "outro";
}

export function getHistoricoLink(
  referenciaId: string | null | undefined,
  tipoEvento: string,
): string | null {
  if (!referenciaId) return null;

  const categoria = getHistoricoCategoria(tipoEvento);

  if (categoria === "atendimento") return `/atendimentos/${referenciaId}`;
  if (categoria === "cotacao") return `/cotacoes/${referenciaId}`;

  return null;
}

const CATEGORIA_CONFIG: Record<
  HistoricoCategoria,
  { icon: LucideIcon; colorClass: string; label: string }
> = {
  atendimento: {
    icon: ClipboardList,
    colorClass: "bg-success/15 text-success",
    label: "Atendimento",
  },
  status: {
    icon: Activity,
    colorClass: "bg-warning/15 text-warning",
    label: "Alteração de status",
  },
  cotacao: {
    icon: FileText,
    colorClass: "bg-chart-1/15 text-chart-1",
    label: "Cotação",
  },
  documento: {
    icon: File,
    colorClass: "bg-secondary text-secondary-foreground",
    label: "Documento",
  },
  outro: {
    icon: CircleDot,
    colorClass: "bg-muted text-muted-foreground",
    label: "Evento",
  },
};

export function getHistoricoCategoriaConfig(categoria: HistoricoCategoria) {
  return CATEGORIA_CONFIG[categoria];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- lib/historico-utils.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/historico-utils.ts lib/historico-utils.test.ts
git commit -m "feat: add historico category and link utils"
```

---

### Task 4: `services/atendimentos-service.ts`

**Files:**
- Create: `web/services/atendimentos-service.ts`
- Create: `web/services/atendimentos-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// web/services/atendimentos-service.test.ts
import { describe, it, expect } from "vitest";
import { mapApiAtendimentoToAtendimento } from "./atendimentos-service";

describe("mapApiAtendimentoToAtendimento", () => {
  it("maps snake_case api dto to camelCase atendimento", () => {
    const result = mapApiAtendimentoToAtendimento({
      id: "uuid-1",
      paciente_id: "p-1",
      tipo: "consulta",
      data_atendimento: "2026-06-07",
      descricao: "Consulta de rotina",
      created_at: "2026-06-07T10:00:00Z",
      updated_at: "2026-06-08T10:00:00Z",
      created_by: "u-1",
      pacientes: { id: "p-1", nome: "Maria Silva" },
    });

    expect(result).toEqual({
      id: "uuid-1",
      pacienteId: "p-1",
      tipo: "consulta",
      dataAtendimento: "2026-06-07",
      descricao: "Consulta de rotina",
      criadoEm: "2026-06-07T10:00:00Z",
      atualizadoEm: "2026-06-08T10:00:00Z",
      pacienteNome: "Maria Silva",
      criadoPorNome: undefined,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- services/atendimentos-service.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// web/services/atendimentos-service.ts
import axios from "axios";
import { api } from "./api";
import { getFriendlyApiError } from "@/lib/api-errors";
import type {
  Atendimento,
  AtendimentoCreateInput,
  AtendimentoUpdateInput,
  TipoAtendimento,
} from "@/types";

export interface ApiAtendimentoDTO {
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

interface ApiErrorBody {
  erro?: string;
  error?: string;
  message?: string;
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

export function mapApiAtendimentoToAtendimento(
  dto: ApiAtendimentoDTO,
): Atendimento {
  return {
    id: dto.id,
    pacienteId: dto.paciente_id,
    tipo: dto.tipo as TipoAtendimento,
    dataAtendimento: dto.data_atendimento,
    descricao: dto.descricao ?? "",
    criadoEm: dto.created_at,
    atualizadoEm: dto.updated_at ?? undefined,
    pacienteNome: dto.pacientes?.nome,
  };
}

function mapAtendimentoToApiPayload(
  dados: AtendimentoCreateInput | AtendimentoUpdateInput,
) {
  return {
    paciente_id: dados.pacienteId,
    tipo: dados.tipo,
    data_atendimento: dados.dataAtendimento,
    descricao: dados.descricao,
  };
}

export async function listarAtendimentos(): Promise<Atendimento[]> {
  try {
    const response = await api.get<ApiAtendimentoDTO[]>("/atendimentos");
    return response.data.map(mapApiAtendimentoToAtendimento);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar atendimentos."));
  }
}

export async function obterAtendimento(id: string): Promise<Atendimento> {
  try {
    const response = await api.get<ApiAtendimentoDTO>(`/atendimentos/${id}`);
    return mapApiAtendimentoToAtendimento(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar atendimento."));
  }
}

export async function criarAtendimento(
  dados: AtendimentoCreateInput,
): Promise<Atendimento> {
  try {
    const response = await api.post<ApiAtendimentoDTO>(
      "/atendimentos",
      mapAtendimentoToApiPayload(dados),
    );
    return mapApiAtendimentoToAtendimento(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao criar atendimento."));
  }
}

export async function atualizarAtendimento(
  id: string,
  dados: AtendimentoUpdateInput,
): Promise<Atendimento> {
  try {
    const response = await api.put<ApiAtendimentoDTO>(
      `/atendimentos/${id}`,
      mapAtendimentoToApiPayload(dados),
    );
    return mapApiAtendimentoToAtendimento(response.data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao atualizar atendimento."));
  }
}

export async function excluirAtendimento(id: string): Promise<void> {
  try {
    await api.delete(`/atendimentos/${id}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao excluir atendimento."));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- services/atendimentos-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/atendimentos-service.ts services/atendimentos-service.test.ts
git commit -m "feat: add atendimentos service with api integration"
```

---

### Task 5: `services/historico-service.ts`

**Files:**
- Create: `web/services/historico-service.ts`
- Create: `web/services/historico-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// web/services/historico-service.test.ts
import { describe, it, expect } from "vitest";
import { mapApiHistoricoToHistoricoPaciente } from "./historico-service";

describe("mapApiHistoricoToHistoricoPaciente", () => {
  it("maps snake_case api dto to camelCase historico", () => {
    expect(
      mapApiHistoricoToHistoricoPaciente({
        id: "h-1",
        paciente_id: "p-1",
        tipo_evento: "ATENDIMENTO",
        descricao: "Consulta realizada",
        referencia_id: "a-1",
        created_at: "2026-06-07T10:00:00Z",
        usuarios: { id: "u-1", nome: "Gestor", email: "gestor@email.com" },
      }),
    ).toEqual({
      id: "h-1",
      pacienteId: "p-1",
      tipoEvento: "ATENDIMENTO",
      descricao: "Consulta realizada",
      referenciaId: "a-1",
      criadoEm: "2026-06-07T10:00:00Z",
      usuarioNome: "Gestor",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- services/historico-service.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```typescript
// web/services/historico-service.ts
import axios from "axios";
import { api } from "./api";
import { getFriendlyApiError } from "@/lib/api-errors";
import type { HistoricoPaciente } from "@/types";

export interface ApiHistoricoPacienteDTO {
  id: string;
  paciente_id: string;
  tipo_evento: string;
  descricao: string;
  referencia_id?: string | null;
  created_at: string;
  usuarios?: { id: string; nome: string; email: string } | null;
}

interface ApiErrorBody {
  erro?: string;
  error?: string;
  message?: string;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    const candidate = data?.erro ?? data?.error ?? data?.message;

    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return getFriendlyApiError(error, fallback);
}

export function mapApiHistoricoToHistoricoPaciente(
  dto: ApiHistoricoPacienteDTO,
): HistoricoPaciente {
  return {
    id: dto.id,
    pacienteId: dto.paciente_id,
    tipoEvento: dto.tipo_evento,
    descricao: dto.descricao ?? "",
    referenciaId: dto.referencia_id ?? null,
    criadoEm: dto.created_at,
    usuarioNome: dto.usuarios?.nome,
  };
}

export async function listarHistoricoPaciente(
  pacienteId: string,
): Promise<HistoricoPaciente[]> {
  try {
    const response = await api.get<ApiHistoricoPacienteDTO[]>(
      "/historico-pacientes",
      { params: { paciente_id: pacienteId } },
    );
    return response.data.map(mapApiHistoricoToHistoricoPaciente);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Erro ao carregar histórico."));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- services/historico-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add services/historico-service.ts services/historico-service.test.ts
git commit -m "feat: add historico service with api integration"
```

---

### Task 6: `hooks/use-atendimentos.ts`

**Files:**
- Create: `web/hooks/use-atendimentos.ts`

- [ ] **Step 1: Create hook with cross-invalidation**

```typescript
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarAtendimentos,
  obterAtendimento,
  criarAtendimento,
  atualizarAtendimento,
  excluirAtendimento,
} from "@/services/atendimentos-service";
import type { AtendimentoCreateInput, AtendimentoUpdateInput } from "@/types";

function invalidateAtendimentosAndHistorico(
  queryClient: ReturnType<typeof useQueryClient>,
  pacienteId?: string,
) {
  queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
  if (pacienteId) {
    queryClient.invalidateQueries({ queryKey: ["historico", pacienteId] });
  }
}

export function useAtendimentos() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["atendimentos"],
    queryFn: listarAtendimentos,
    staleTime: 1000 * 60,
  });

  const createMutation = useMutation({
    mutationFn: (dados: AtendimentoCreateInput) => criarAtendimento(dados),
    onSuccess: (_, dados) => {
      invalidateAtendimentosAndHistorico(queryClient, dados.pacienteId);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: AtendimentoUpdateInput }) =>
      atualizarAtendimento(id, dados),
    onSuccess: (atendimento) => {
      invalidateAtendimentosAndHistorico(queryClient, atendimento.pacienteId);
      queryClient.invalidateQueries({ queryKey: ["atendimentos", atendimento.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string; pacienteId: string }) =>
      excluirAtendimento(id),
    onSuccess: (_, { pacienteId }) => {
      invalidateAtendimentosAndHistorico(queryClient, pacienteId);
    },
  });

  return {
    atendimentos: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    criarAtendimento: createMutation.mutateAsync,
    atualizarAtendimento: updateMutation.mutateAsync,
    excluirAtendimento: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    query,
  };
}

export function useAtendimento(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["atendimentos", id],
    queryFn: () => obterAtendimento(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });

  const invalidate = (pacienteId?: string) => {
    invalidateAtendimentosAndHistorico(queryClient, pacienteId);
    queryClient.invalidateQueries({ queryKey: ["atendimentos", id] });
  };

  const updateMutation = useMutation({
    mutationFn: (dados: AtendimentoUpdateInput) => atualizarAtendimento(id, dados),
    onSuccess: (atendimento) => invalidate(atendimento.pacienteId),
  });

  const deleteMutation = useMutation({
    mutationFn: (pacienteId: string) => excluirAtendimento(id),
    onSuccess: (_, pacienteId) => invalidate(pacienteId),
  });

  return {
    atendimento: query.data ?? null,
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    atualizarAtendimento: updateMutation.mutateAsync,
    excluirAtendimento: deleteMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    query,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/use-atendimentos.ts
git commit -m "feat: add use-atendimentos hook with historico invalidation"
```

---

### Task 7: `hooks/use-historico.ts`

**Files:**
- Create: `web/hooks/use-historico.ts`

- [ ] **Step 1: Create read-only hook**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { listarHistoricoPaciente } from "@/services/historico-service";

export function useHistorico(pacienteId: string) {
  const query = useQuery({
    queryKey: ["historico", pacienteId],
    queryFn: () => listarHistoricoPaciente(pacienteId),
    enabled: Boolean(pacienteId),
    staleTime: 1000 * 60,
  });

  return {
    historico: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : ((query.error as any) ?? null),
    refetch: query.refetch,
    query,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/use-historico.ts
git commit -m "feat: add use-historico hook"
```

---

### Task 8: Atendimentos list page

**Files:**
- Modify: `web/app/atendimentos/page.tsx`

Mirror `app/cotacoes/page.tsx`: API data, search + tipo filter, sort by `dataAtendimento` desc, gestor-only delete with `AlertDialog`, loading/error/empty states.

- [ ] **Step 1: Replace page implementation**

Key changes:
- Remove `ProtectedRoute`, `useData`, `StatusBadge`, area/status filters
- Use `DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}`
- Use `useAtendimentos()`, `useUsuario()` for `isGestor`
- Columns: Data (`formatDataAtendimento`), Paciente (`pacienteNome`), Tipo (`getTipoAtendimentoLabel`), Descrição (truncate), Actions
- Filter: search on `pacienteNome` + `descricao`; tipo select with `TIPOS_ATENDIMENTO` + "todos"
- Sort: `[...atendimentos].sort((a, b) => b.dataAtendimento.localeCompare(a.dataAtendimento))` then filter
- Delete: `AlertDialog` calling `excluirAtendimento({ id, pacienteId })` — only when `isGestor`
- Loading: `TableLoading`; error: destructive `Alert` + retry button; empty: `Empty` + "Novo Atendimento" CTA

Imports to use:

```typescript
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";
import { useAtendimentos } from "@/hooks/use-atendimentos";
import { useUsuario } from "@/hooks/use-usuario";
import {
  getTipoAtendimentoLabel,
  formatDataAtendimento,
} from "@/lib/atendimentos-utils";
import { TIPOS_ATENDIMENTO } from "@/types";
```

- [ ] **Step 2: Manual smoke check**

Run dev server; navigate to `/atendimentos` — should show loading then API data (or empty state).

- [ ] **Step 3: Commit**

```bash
git add app/atendimentos/page.tsx
git commit -m "feat: wire atendimentos list page to api"
```

---

### Task 9: Atendimento form

**Files:**
- Modify: `web/components/atendimentos/atendimento-form.tsx`

- [ ] **Step 1: Rewrite form**

Key changes:
- Remove `useData`, `useAuth`, area/observações/datetime-local/status workflow buttons
- Use `usePacientes()`, `useAtendimentos()` mutations
- Read `pacienteId` from `useSearchParams()` — pre-fill and optionally disable paciente select
- Fields: paciente (`Select` or native select), tipo (`TIPOS_ATENDIMENTO`), data (`Input type="date"`, default today as `yyyy-MM-dd`), descrição (`Textarea`, required)
- Validation before submit: all four fields required
- Submit single "Salvar" button
- On create: `criarAtendimento(dados)` → redirect to `/pacientes/:pacienteId` if `?pacienteId=` present, else `/atendimentos/:id`
- On edit: `atualizarAtendimento({ id, dados })` → redirect to `/atendimentos/:id`
- Active patients only: `pacientes.filter(p => p.status === StatusPaciente.ATIVO)`
- Show mutation error in `Alert` if submit fails

Form state initializer for edit:

```typescript
const [formData, setFormData] = useState({
  pacienteId: atendimento?.pacienteId || prefillPacienteId || "",
  tipo: atendimento?.tipo || "consulta",
  dataAtendimento: atendimento?.dataAtendimento || todayDateOnly(),
  descricao: atendimento?.descricao || "",
});
```

Helper `todayDateOnly()` — copy pattern from `lib/cotacoes-utils.ts`.

- [ ] **Step 2: Commit**

```bash
git add components/atendimentos/atendimento-form.tsx
git commit -m "feat: rewrite atendimento form for api-backed crud"
```

---

### Task 10: Atendimentos route pages (novo, detail, editar)

**Files:**
- Modify: `web/app/atendimentos/novo/page.tsx`
- Modify: `web/app/atendimentos/[id]/page.tsx`
- Modify: `web/app/atendimentos/[id]/editar/page.tsx`

- [ ] **Step 1: Update `novo/page.tsx`**

```typescript
"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AtendimentoForm } from "@/components/atendimentos/atendimento-form";
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";

export default function NovoAtendimentoPage() {
  return (
    <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
      <AtendimentoForm />
    </DashboardLayout>
  );
}
```

- [ ] **Step 2: Rewrite `[id]/page.tsx`**

- Remove `ProtectedRoute`, `useData`, workflow buttons (`Concluir`/`Cancelar`), `StatusBadge`, area/responsável cards
- Use `useAtendimento(id)` — show `TableLoading` while loading; `notFound()` when loaded and null/404
- Cards: Paciente (link `/pacientes/:pacienteId`), Tipo (label), Data (`formatDataAtendimento`), Descrição, metadata (`criadoEm`, `atualizadoEm` formatted)
- Actions: Editar (all users), Excluir (gestor only, `AlertDialog`) → `excluirAtendimento(atendimento.pacienteId)` → redirect `/atendimentos`
- Layout: `DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}`

- [ ] **Step 3: Rewrite `[id]/editar/page.tsx`**

```typescript
"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AtendimentoForm } from "@/components/atendimentos/atendimento-form";
import { ROLES_ATENDIMENTOS_E_COTACOES } from "@/lib/access-control";
import { useAtendimento } from "@/hooks/use-atendimentos";
import { TableLoading } from "@/components/ui/table-state";

interface EditarAtendimentoPageProps {
  params: Promise<{ id: string }>;
}

export default function EditarAtendimentoPage({ params }: EditarAtendimentoPageProps) {
  const { id } = use(params);
  const { atendimento, isLoading, error } = useAtendimento(id);

  if (isLoading) {
    return (
      <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
        <TableLoading columns={1} rows={4} />
      </DashboardLayout>
    );
  }

  if (!atendimento) {
    notFound();
  }

  return (
    <DashboardLayout allowedRoles={ROLES_ATENDIMENTOS_E_COTACOES}>
      <AtendimentoForm atendimento={atendimento} isEditing />
    </DashboardLayout>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/atendimentos/novo/page.tsx app/atendimentos/\[id\]/page.tsx app/atendimentos/\[id\]/editar/page.tsx
git commit -m "feat: wire atendimentos detail and edit pages to api"
```

---

### Task 11: Patient tab — Atendimentos

**Files:**
- Modify: `web/components/pacientes/paciente-atendimentos.tsx`

- [ ] **Step 1: Replace mock with API hook**

```typescript
"use client";

import Link from "next/link";
import { Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Empty } from "@/components/ui/empty";
import { TableLoading } from "@/components/ui/table-state";
import TableActions, { TableActionLink } from "@/components/ui/table-actions";
import { useAtendimentos } from "@/hooks/use-atendimentos";
import {
  formatDataAtendimento,
  getTipoAtendimentoLabel,
} from "@/lib/atendimentos-utils";

interface PacienteAtendimentosProps {
  pacienteId: string;
}

export function PacienteAtendimentos({ pacienteId }: PacienteAtendimentosProps) {
  const { atendimentos, isLoading, error, refetch } = useAtendimentos();

  const atendimentosPaciente = atendimentos
    .filter((a) => a.pacienteId === pacienteId)
    .sort((a, b) => b.dataAtendimento.localeCompare(a.dataAtendimento));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Atendimentos</CardTitle>
          <CardDescription>Registros de atendimentos do paciente</CardDescription>
        </div>
        <Button asChild>
          <Link href={`/atendimentos/novo?pacienteId=${pacienteId}`}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Atendimento
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && <TableLoading columns={4} rows={3} />}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro ao carregar atendimentos</AlertTitle>
            <AlertDescription className="flex items-center gap-2">
              {error}
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && atendimentosPaciente.length === 0 && (
          <Empty
            title="Nenhum atendimento registrado"
            description="Os atendimentos realizados para este paciente aparecerão aqui."
          />
        )}
        {!isLoading && !error && atendimentosPaciente.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-17.5">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atendimentosPaciente.map((atendimento) => (
                <TableRow key={atendimento.id}>
                  <TableCell>{formatDataAtendimento(atendimento.dataAtendimento)}</TableCell>
                  <TableCell>{getTipoAtendimentoLabel(atendimento.tipo)}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {atendimento.descricao}
                  </TableCell>
                  <TableCell>
                    <TableActions>
                      <TableActionLink
                        href={`/atendimentos/${atendimento.id}`}
                        icon={Eye}
                        label="Ver"
                      />
                    </TableActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/pacientes/paciente-atendimentos.tsx
git commit -m "feat: wire paciente atendimentos tab to api"
```

---

### Task 12: Patient tab — Histórico

**Files:**
- Modify: `web/components/pacientes/paciente-historico.tsx`

- [ ] **Step 1: Replace mock with API hook and historico-utils**

Key changes:
- Use `useHistorico(pacienteId)` instead of `useData`
- Map each entry via `getHistoricoCategoria`, `getHistoricoCategoriaConfig`, `getHistoricoLink`
- Display: `descricao`, category label, timestamp (`criadoEm` formatted `dd/MM/yyyy 'às' HH:mm`), `usuarioNome`
- Show "Ver detalhes" `Link` when `getHistoricoLink()` returns a path
- Loading: skeleton or centered spinner; error: `Alert` + retry; empty: existing `Empty`
- Remove `TipoEvento` import

Timeline item pattern:

```typescript
const categoria = getHistoricoCategoria(item.tipoEvento);
const config = getHistoricoCategoriaConfig(categoria);
const Icon = config.icon;
const link = getHistoricoLink(item.referenciaId, item.tipoEvento);
```

- [ ] **Step 2: Commit**

```bash
git add components/pacientes/paciente-historico.tsx
git commit -m "feat: wire paciente historico tab to api"
```

---

### Task 13: Dashboard and Relatórios

**Files:**
- Modify: `web/app/dashboard/page.tsx`
- Modify: `web/app/relatorios/page.tsx`

- [ ] **Step 1: Update dashboard atendimento count**

In `app/dashboard/page.tsx`:
- Add `import { useAtendimentos } from "@/hooks/use-atendimentos"`
- Replace `stats.totalAtendimentos` with `useAtendimentos().atendimentos.length`
- Keep `getStats()` for paciente stats only

```typescript
const { atendimentos } = useAtendimentos();
// ...
{
  title: 'Atendimentos',
  value: atendimentos.length,
  // ...
}
```

- [ ] **Step 2: Update relatórios minimal mock removal**

In `app/relatorios/page.tsx`:
- Replace `const { pacientes, atendimentos, areas } = useData()` with `useAtendimentos()` for atendimentos
- Update `filtrarPorPeriodo` usage: atendimentos use `dataAtendimento` field — extend generic filter or map before filtering:

```typescript
const { atendimentos } = useAtendimentos();
const atendimentosFiltrados = filtrarPorPeriodo(
  atendimentos.map((a) => ({ ...a, data: a.dataAtendimento })),
);
```

- Replace **Atendimentos por Status** chart with **Atendimentos por Tipo** (group by `tipo`, label via `getTipoAtendimentoLabel`)
- Remove **Atendimentos por Area** chart section (area no longer on atendimento model) — replace card body with message: "Dados por área não disponíveis para atendimentos."

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx app/relatorios/page.tsx
git commit -m "feat: use api atendimentos in dashboard and relatorios"
```

---

### Task 14: Mock and Context cleanup

**Files:**
- Delete: `web/mocks/atendimentos.ts`
- Delete: `web/mocks/historico.ts`
- Modify: `web/mocks/index.ts`
- Modify: `web/contexts/data-context.tsx`
- Modify: `web/components/pacientes/paciente-form.tsx`
- Modify: `web/components/pacientes/paciente-documentos.tsx` (remove unused `TipoEvento` import if present)

- [ ] **Step 1: Delete mock files and update index**

Remove from `mocks/index.ts`:

```typescript
export { atendimentosMock } from './atendimentos'
export { historicoMock } from './historico'
```

Delete `mocks/atendimentos.ts` and `mocks/historico.ts`.

- [ ] **Step 2: Clean `data-context.tsx`**

Remove:
- Imports: `Atendimento`, `Historico`, `TipoEvento`, `atendimentosMock`, `historicoMock`
- State: `atendimentos`, `historico`
- Methods: `getAtendimentoById`, `getAtendimentosByPaciente`, `addAtendimento`, `updateAtendimento`, `getHistoricoByPaciente`, `addHistorico`
- `totalAtendimentos` from `getStats()` — remove field from return and update `DashboardStats` usage (dashboard already uses hook)
- `atendimentos` guard in `deleteArea` — remove the check block that prevents area deletion when mock atendimentos reference the area
- Historico side-effects inside `alterarStatusPaciente` and `removeDocumento` — keep the core operations, delete the `setHistorico` / `novoHistorico` blocks

- [ ] **Step 3: Remove mock historico writes from `paciente-form.tsx`**

Remove `addHistorico` from `useData()` destructure.
Remove both `addHistorico({...})` blocks after create/update (lines ~295–302 and ~308–314).
Remove `TipoEvento` import if unused.

- [ ] **Step 4: Update `DashboardStats` in types if `totalAtendimentos` removed**

Either remove `totalAtendimentos` from `DashboardStats` interface or leave it unused — prefer removing from interface and `getStats()` return to avoid dead code.

- [ ] **Step 5: Verify no remaining references**

Run: `cd web && rg "atendimentosMock|historicoMock|getAtendimentoById|addAtendimento|getHistoricoByPaciente|addHistorico|TipoEvento" --glob '*.{ts,tsx}'`
Expected: no matches (except possibly spec/plan docs)

- [ ] **Step 6: Commit**

```bash
git add mocks/index.ts contexts/data-context.tsx components/pacientes/paciente-form.tsx components/pacientes/paciente-documentos.tsx types/index.ts
git rm mocks/atendimentos.ts mocks/historico.ts
git commit -m "refactor: remove atendimentos and historico mocks from context"
```

---

### Task 15: Final verification

**Files:** (none — verification only)

- [ ] **Step 1: Run unit tests**

Run: `cd web && npm test`
Expected: all tests PASS

- [ ] **Step 2: Run lint**

Run: `cd web && npm run lint`
Expected: no errors (fix any import/unused variable issues)

- [ ] **Step 3: Run production build**

Run: `cd web && npm run build`
Expected: build succeeds

- [ ] **Step 4: E2E verification (Playwright CLI)**

Prerequisites: API at `http://localhost:3000`, web at `http://localhost:3001`.

Follow spec verification checklist:
1. Login `gestor@email.com` / `123` → `/atendimentos`
2. List loads from API (no `atend-001` mock IDs)
3. Create atendimento → detail page
4. Patient **Atendimentos** tab shows new record
5. Patient **Histórico** tab shows `ATENDIMENTO` event with link
6. Edit → verify list + detail
7. Delete (gestor) → removed from list; historico shows `ATENDIMENTO_REMOVIDO`
8. "Novo Atendimento" from patient tab pre-fills paciente
9. Dashboard shows correct count

- [ ] **Step 5: Commit any fixups**

```bash
git add -A
git commit -m "fix: address verification issues for atendimentos integration"
```

(Only if fixups were needed.)

---

## Self-Review Checklist

| Spec requirement | Task |
|-----------------|------|
| `atendimentos-service.ts` CRUD | Task 4 |
| `historico-service.ts` list by paciente | Task 5 |
| `use-atendimentos` + cross-invalidation | Task 6 |
| `use-historico` read-only | Task 7 |
| List page (no status/area) | Task 8 |
| Minimal form (4 fields) | Task 9 |
| Detail/edit/novo pages | Task 10 |
| Patient Atendimentos tab | Task 11 |
| Patient Histórico tab + utils | Tasks 3, 12 |
| Dashboard count | Task 13 |
| Relatórios mock removal | Task 13 |
| Mock/context cleanup | Task 14 |
| Gestor-only delete | Tasks 8, 10 |
| Permissions via `ROLES_ATENDIMENTOS_E_COTACOES` | Tasks 8, 10 |
| Types aligned with API | Task 1 |

**Out of scope (confirmed):** API changes, status workflow, extra form fields, server-side paciente filter, paciente page migration, API tests.

**Follow-up note:** `paciente-form.tsx` mock historico writes are removed in Task 14 — aligns with spec note that patient registration does not write historico via API.
