# RF_F2 — Atualizar Status do Paciente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire patient status UI to `PATCH /pacientes/:id/status`, remove patient mocks, migrate affected pages off `useData`, and fix status mapping / form edit bugs.

**Architecture:** `pacientes-service.ts` handles HTTP; `lib/pacientes-utils.ts` centralizes DTO mappers and stats; `use-pacientes.ts` exposes `usePacientes()` + `usePaciente(id)` with React Query mutations; pages consume hooks directly. Status changes invalidate `["pacientes"]`, `["pacientes", id]`, and `["historico", id]`.

**Tech Stack:** Next.js 16, React 19, TanStack Query v5, Axios, TypeScript, Vitest (unit tests for mappers).

**Spec:** `web/docs/superpowers/specs/2026-06-07-atualizar-status-paciente-design.md`

---

## File Structure

| File | Responsibility |
|------|----------------|
| `lib/pacientes-utils.ts` | Status/patient mappers, `computePacienteStats` |
| `lib/pacientes-utils.test.ts` | Unit tests for status mapper bug fix + stats |
| `services/pacientes-service.ts` | Add `alterarStatusPaciente` PATCH call |
| `hooks/use-pacientes.ts` | Refactor mappers import + add `usePaciente(id)` |
| `hooks/use-usuario.ts` | Add `podeAlterarStatusPaciente` |
| `components/pacientes/alterar-status-modal.tsx` | Rewire to `usePaciente` mutation |
| `app/pacientes/[id]/page.tsx` | Migrate off `useData` |
| `app/pacientes/[id]/editar/page.tsx` | Migrate off `useData` |
| `components/pacientes/paciente-form.tsx` | Omit status on edit; invalidate queries |
| `app/dashboard/page.tsx` | `usePacientes` + `computePacienteStats` |
| `app/relatorios/page.tsx` | `usePacientes` + `StatusPaciente` enum |
| `contexts/data-context.tsx` | Remove `alterarStatusPaciente` slice |
| `mocks/pacientes.ts` | **Delete** |
| `mocks/index.ts` | Remove pacientes export |

---

### Task 1: `lib/pacientes-utils.ts`

**Files:**
- Create: `web/lib/pacientes-utils.ts`
- Create: `web/lib/pacientes-utils.test.ts`

Extract mappers from `hooks/use-pacientes.ts`. The critical bug fix: `inativo` must map to `SUSPENSO`, not `ENCERRADO`.

- [ ] **Step 1: Write the failing test**

```typescript
// web/lib/pacientes-utils.test.ts
import { describe, it, expect } from "vitest";
import {
  mapApiStatusToStatusPaciente,
  computePacienteStats,
} from "./pacientes-utils";
import { StatusPaciente } from "@/types";
import type { Paciente } from "@/types";

describe("mapApiStatusToStatusPaciente", () => {
  it("maps suspenso and inativo to SUSPENSO", () => {
    expect(mapApiStatusToStatusPaciente("suspenso")).toBe(StatusPaciente.SUSPENSO);
    expect(mapApiStatusToStatusPaciente("inativo")).toBe(StatusPaciente.SUSPENSO);
    expect(mapApiStatusToStatusPaciente("SUSPENSO")).toBe(StatusPaciente.SUSPENSO);
  });

  it("maps encerrado, alta and obito to ENCERRADO", () => {
    expect(mapApiStatusToStatusPaciente("encerrado")).toBe(StatusPaciente.ENCERRADO);
    expect(mapApiStatusToStatusPaciente("alta")).toBe(StatusPaciente.ENCERRADO);
    expect(mapApiStatusToStatusPaciente("obito")).toBe(StatusPaciente.ENCERRADO);
  });

  it("defaults to ATIVO for ativo and unknown values", () => {
    expect(mapApiStatusToStatusPaciente("ativo")).toBe(StatusPaciente.ATIVO);
    expect(mapApiStatusToStatusPaciente(null)).toBe(StatusPaciente.ATIVO);
    expect(mapApiStatusToStatusPaciente(undefined)).toBe(StatusPaciente.ATIVO);
    expect(mapApiStatusToStatusPaciente("")).toBe(StatusPaciente.ATIVO);
  });
});

describe("computePacienteStats", () => {
  const makePaciente = (status: StatusPaciente): Paciente =>
    ({
      id: "1",
      nome: "Test",
      nomeCompleto: "Test",
      cpf: "000.000.000-00",
      status,
    }) as Paciente;

  it("counts patients by status", () => {
    const pacientes = [
      makePaciente(StatusPaciente.ATIVO),
      makePaciente(StatusPaciente.ATIVO),
      makePaciente(StatusPaciente.SUSPENSO),
      makePaciente(StatusPaciente.ENCERRADO),
    ];

    expect(computePacienteStats(pacientes)).toEqual({
      totalPacientes: 4,
      pacientesAtivos: 2,
      pacientesSuspensos: 1,
      pacientesEncerrados: 1,
    });
  });

  it("returns zeros for empty list", () => {
    expect(computePacienteStats([])).toEqual({
      totalPacientes: 0,
      pacientesAtivos: 0,
      pacientesSuspensos: 0,
      pacientesEncerrados: 0,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm test -- lib/pacientes-utils.test.ts`
Expected: FAIL with "Cannot find module './pacientes-utils'"

- [ ] **Step 3: Write implementation**

```typescript
// web/lib/pacientes-utils.ts
import type { ApiPacienteDTO } from "@/services/pacientes-service";
import {
  formatCep,
  formatCpf,
  formatPhone,
  toDateInputValue,
} from "@/lib/formatters";
import { Paciente, Sexo, EstadoCivil, StatusPaciente } from "@/types";

function formatApiDate(date?: string | null) {
  return toDateInputValue(date);
}

function mapApiSexoToSexo(sexo?: string | null): Sexo {
  if (!sexo) return Sexo.OUTRO;
  const normalized = sexo.trim().toUpperCase();
  if (normalized === "M" || normalized === "MASCULINO") return Sexo.MASCULINO;
  if (normalized === "F" || normalized === "FEMININO") return Sexo.FEMININO;
  return Sexo.OUTRO;
}

function mapApiEstadoCivilToEstadoCivil(estadoCivil?: string | null): EstadoCivil {
  if (!estadoCivil) return EstadoCivil.SOLTEIRO;
  const normalized = estadoCivil.trim().toLowerCase();
  if (normalized.includes("casad")) return EstadoCivil.CASADO;
  if (normalized.includes("divorc")) return EstadoCivil.DIVORCIADO;
  if (normalized.includes("viuv")) return EstadoCivil.VIUVO;
  if (normalized.includes("uniao") || normalized.includes("união"))
    return EstadoCivil.UNIAO_ESTAVEL;
  return EstadoCivil.SOLTEIRO;
}

export function mapApiStatusToStatusPaciente(
  status?: string | null,
): StatusPaciente {
  if (!status) return StatusPaciente.ATIVO;
  const normalized = status.trim().toLowerCase();
  if (normalized === "suspenso" || normalized === "inativo")
    return StatusPaciente.SUSPENSO;
  if (
    normalized === "encerrado" ||
    normalized === "alta" ||
    normalized === "obito"
  )
    return StatusPaciente.ENCERRADO;
  return StatusPaciente.ATIVO;
}

export function mapApiPacienteToPaciente(apiPaciente: ApiPacienteDTO): Paciente {
  return {
    id: apiPaciente.id ?? apiPaciente.id_origem ?? "",
    nome: apiPaciente.nome ?? "",
    nomeCompleto: apiPaciente.nome ?? "",
    cpf: formatCpf(apiPaciente.cpf),
    rg: apiPaciente.rg ?? "",
    dataNascimento: formatApiDate(apiPaciente.data_nascimento),
    sexo: mapApiSexoToSexo(apiPaciente.sexo),
    estadoCivil: mapApiEstadoCivilToEstadoCivil(apiPaciente.estado_civil),
    naturalidade: "",
    escolaridade: "",
    profissao: apiPaciente.profissao ?? "",
    endereco: {
      logradouro: apiPaciente.endereco ?? "",
      numero: apiPaciente.numero ?? "",
      complemento: apiPaciente.complemento ?? "",
      bairro: apiPaciente.bairro ?? "",
      cidade: apiPaciente.cidade ?? "",
      estado: apiPaciente.estado ?? "",
      cep: formatCep(apiPaciente.cep ?? ""),
    },
    telefone: formatPhone(apiPaciente.celular ?? apiPaciente.telefone ?? ""),
    nomePai: "",
    nomeMae: "",
    numeroSUS: apiPaciente.id_origem ?? "",
    diagnosticoOncologico: apiPaciente.diagnostico ?? "",
    diagnostico: apiPaciente.diagnostico ?? "",
    setor: apiPaciente.hospital_tratamento ?? "",
    areaTratamento: apiPaciente.origem ?? "",
    dataInicioTratamento: formatApiDate(apiPaciente.data_inicio_tratamento),
    medicoResponsavel: apiPaciente.medico_responsavel ?? "",
    status: mapApiStatusToStatusPaciente(apiPaciente.status),
    criadoEm: apiPaciente.created_at,
    atualizadoEm: apiPaciente.updated_at,
  };
}

export function computePacienteStats(pacientes: Paciente[]) {
  return {
    totalPacientes: pacientes.length,
    pacientesAtivos: pacientes.filter((p) => p.status === StatusPaciente.ATIVO)
      .length,
    pacientesSuspensos: pacientes.filter(
      (p) => p.status === StatusPaciente.SUSPENSO,
    ).length,
    pacientesEncerrados: pacientes.filter(
      (p) => p.status === StatusPaciente.ENCERRADO,
    ).length,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npm test -- lib/pacientes-utils.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add lib/pacientes-utils.ts lib/pacientes-utils.test.ts
git commit -m "feat: add paciente status mappers and stats utils"
```

---

### Task 2: `alterarStatusPaciente` service

**Files:**
- Modify: `web/services/pacientes-service.ts`

Add PATCH endpoint following `alternarStatusCotacao` pattern in `cotacoes-service.ts`.

- [ ] **Step 1: Add function after `atualizarPaciente`**

```typescript
export type PacienteStatusERS = "ativo" | "suspenso" | "encerrado";

export async function alterarStatusPaciente(
  id: string,
  status: PacienteStatusERS,
): Promise<ApiPacienteDTO> {
  try {
    const response = await api.patch<ApiPacienteDTO>(
      `/pacientes/${id}/status`,
      { status },
    );

    const data = (response.data as any)?.data ?? response.data;

    return data as ApiPacienteDTO;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Erro ao alterar status do paciente."),
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd web && npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors related to `pacientes-service.ts`

- [ ] **Step 3: Commit**

```bash
git add services/pacientes-service.ts
git commit -m "feat: add alterar status paciente api call"
```

---

### Task 3: Refactor `hooks/use-pacientes.ts` + add `usePaciente(id)`

**Files:**
- Modify: `web/hooks/use-pacientes.ts`

- [ ] **Step 1: Replace file contents**

```typescript
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarPacientes,
  obterPaciente,
  alterarStatusPaciente,
} from "@/services/pacientes-service";
import { mapApiPacienteToPaciente } from "@/lib/pacientes-utils";
import { StatusPaciente } from "@/types";

export function usePacientes() {
  const query = useQuery({
    queryKey: ["pacientes"],
    queryFn: async () => {
      const dados = await listarPacientes();
      return dados.map(mapApiPacienteToPaciente);
    },
  });

  return {
    pacientes: query.data ?? [],
    isLoading: query.isLoading,
    error:
      query.error instanceof Error
        ? query.error.message
        : ((query.error as any) ?? null),
    refetch: query.refetch,
    query,
  };
}

export function usePaciente(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pacientes", id],
    queryFn: () => obterPaciente(id).then(mapApiPacienteToPaciente),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    queryClient.invalidateQueries({ queryKey: ["pacientes", id] });
    queryClient.invalidateQueries({ queryKey: ["historico", id] });
  };

  const alterarStatusMutation = useMutation({
    mutationFn: (status: StatusPaciente) =>
      alterarStatusPaciente(id, status),
    onSuccess: invalidate,
  });

  return {
    paciente: query.data ?? null,
    isLoading: query.isLoading,
    error:
      query.error instanceof Error
        ? query.error.message
        : ((query.error as any) ?? null),
    refetch: query.refetch,
    alterarStatus: alterarStatusMutation.mutateAsync,
    isAlterandoStatus: alterarStatusMutation.isPending,
    query,
  };
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd web && npx tsc --noEmit 2>&1 | head -20`
Expected: no errors in `use-pacientes.ts`

- [ ] **Step 3: Commit**

```bash
git add hooks/use-pacientes.ts
git commit -m "feat: add usePaciente hook with status mutation"
```

---

### Task 4: `hooks/use-usuario.ts` permission

**Files:**
- Modify: `web/hooks/use-usuario.ts`

- [ ] **Step 1: Add `podeAlterarStatusPaciente`**

```typescript
"use client";

import { useAuth } from "@/contexts/auth-context";
import { PerfilUsuario } from "@/types";

export function useUsuario() {
  const { usuario } = useAuth();
  const perfil = usuario?.perfil ?? null;
  const isGestor = perfil === PerfilUsuario.GESTOR;
  const podeAlterarStatusPaciente =
    perfil === PerfilUsuario.OPERADOR || perfil === PerfilUsuario.GESTOR;

  return { usuario, perfil, isGestor, podeAlterarStatusPaciente };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/use-usuario.ts
git commit -m "feat: add podeAlterarStatusPaciente permission"
```

---

### Task 5: Rewire `alterar-status-modal.tsx`

**Files:**
- Modify: `web/components/pacientes/alterar-status-modal.tsx`

- [ ] **Step 1: Replace imports and hook usage**

Remove `useData`, `useAuth`, manual `isSubmitting`. Use `usePaciente(pacienteId)`.

Replace the component body (keep JSX structure unchanged):

```typescript
"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { usePaciente } from "@/hooks/use-pacientes";
import { StatusPaciente } from "@/types";

interface AlterarStatusModalProps {
  pacienteId: string;
  statusAtual: StatusPaciente;
}

const statusOptions = [
  { value: StatusPaciente.ATIVO, label: "Ativo" },
  { value: StatusPaciente.SUSPENSO, label: "Suspenso" },
  { value: StatusPaciente.ENCERRADO, label: "Encerrado" },
];

export function AlterarStatusModal({ pacienteId, statusAtual }: AlterarStatusModalProps) {
  const { alterarStatus, isAlterandoStatus } = usePaciente(pacienteId);
  const [open, setOpen] = useState(false);
  const [novoStatus, setNovoStatus] = useState<StatusPaciente>(statusAtual);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (novoStatus !== statusAtual) {
      setSubmitError(null);

      try {
        await alterarStatus(novoStatus);
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Erro ao alterar status do paciente.",
        );
        return;
      }
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Alterar Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Status do Paciente</DialogTitle>
          <DialogDescription>
            Selecione o novo status para o paciente. Esta ação será registrada no
            histórico.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="status">Novo Status</FieldLabel>
            <Select
              value={novoStatus}
              onValueChange={(v) => setNovoStatus(v as StatusPaciente)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isAlterandoStatus}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={novoStatus === statusAtual || isAlterandoStatus}
          >
            {isAlterandoStatus ? "Salvando..." : "Confirmar Alteração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/pacientes/alterar-status-modal.tsx
git commit -m "feat: wire alterar status modal to api hook"
```

---

### Task 6: Migrate `app/pacientes/[id]/page.tsx`

**Files:**
- Modify: `web/app/pacientes/[id]/page.tsx`

Replace `useData` + local state + `useEffect` with `usePaciente(id)`. Mirror `app/cotacoes/[id]/page.tsx` loading/error pattern.

- [ ] **Step 1: Update imports**

Remove:
```typescript
import { use, useEffect, useState } from "react";
import { useData } from "@/contexts/data-context";
import { useAuth } from "@/contexts/auth-context";
import { Paciente } from "@/types";
```

Add:
```typescript
import { use } from "react";
import { usePaciente } from "@/hooks/use-pacientes";
import { useUsuario } from "@/hooks/use-usuario";
```

- [ ] **Step 2: Replace component state logic**

Replace lines 40–100 (from `const { id } = use(params)` through `if (!paciente) notFound()`) with:

```typescript
export default function PacienteDetalhePage({ params }: PageProps) {
  const { id } = use(params);
  const { paciente, isLoading, error } = usePaciente(id);
  const { podeAlterarStatusPaciente } = useUsuario();

  if (isLoading) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_DASHBOARD_PACIENTES}>
        <div className="flex min-h-80 items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="h-5 w-5" />
          <span>Carregando paciente...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !paciente) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_DASHBOARD_PACIENTES}>
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar o paciente</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (!paciente) {
    notFound();
  }
```

- [ ] **Step 3: Update permission gate and remove stale error banner**

Replace `{loadError && (` block (lines 113–118) — remove entirely (query error already handled above).

Replace `{podeAlterarStatus() && (` with `{podeAlterarStatusPaciente && (`.

- [ ] **Step 4: Verify TypeScript**

Run: `cd web && npx tsc --noEmit 2>&1 | head -20`
Expected: no errors in `app/pacientes/[id]/page.tsx`

- [ ] **Step 5: Commit**

```bash
git add app/pacientes/[id]/page.tsx
git commit -m "refactor: load paciente detail from usePaciente hook"
```

---

### Task 7: Migrate `app/pacientes/[id]/editar/page.tsx`

**Files:**
- Modify: `web/app/pacientes/[id]/editar/page.tsx`

- [ ] **Step 1: Replace imports and state logic**

Remove `useData`, `useState`, `useEffect`, `Paciente` import.

Add:
```typescript
import { use } from "react";
import { usePaciente } from "@/hooks/use-pacientes";
```

Replace component body (lines 20–79) with:

```typescript
export default function EditarPacientePage({ params }: PageProps) {
  const { id } = use(params);
  const { paciente, isLoading, error } = usePaciente(id);

  if (isLoading) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_DASHBOARD_PACIENTES}>
        <div className="flex min-h-80 items-center justify-center gap-3 text-muted-foreground">
          <Spinner className="h-5 w-5" />
          <span>Carregando paciente...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !paciente) {
    return (
      <DashboardLayout perfisPermitidos={PERFIS_DASHBOARD_PACIENTES}>
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar o paciente</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (!paciente) {
    notFound();
  }
```

Remove the `{loadError && (` stale-data alert block (lines 84–89).

- [ ] **Step 2: Commit**

```bash
git add app/pacientes/[id]/editar/page.tsx
git commit -m "refactor: load paciente edit page from usePaciente hook"
```

---

### Task 8: Fix `paciente-form.tsx` status on edit

**Files:**
- Modify: `web/components/pacientes/paciente-form.tsx`

Bug: edit always sends `status: "ativo"`, resetting suspended/closed patients.

- [ ] **Step 1: Add query invalidation to mutations**

Replace mutations block (lines 63–77) with:

```typescript
const queryClient = useQueryClient();

const criarPacienteMutation = useMutation({
  mutationFn: criarPaciente,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["pacientes"] });
  },
});

const atualizarPacienteMutation = useMutation({
  mutationFn: ({ id, payload }: { id: string; payload: any }) =>
    atualizarPaciente(id, payload),
  onSuccess: (_, { id }) => {
    queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    queryClient.invalidateQueries({ queryKey: ["pacientes", id] });
  },
});
```

Remove the `onSuccess` router redirects from mutations — navigation stays in `handleSubmit`.

- [ ] **Step 2: Split create vs edit payload in `handleSubmit`**

Replace payload construction (lines 256–296) with:

```typescript
const basePayload = {
  nome: formData.nomeCompleto,
  cpf: onlyDigits(formData.cpf || "", 11),
  rg: formData.rg || undefined,
  data_nascimento: formData.dataNascimento || undefined,
  sexo:
    formData.sexo === Sexo.MASCULINO
      ? "M"
      : formData.sexo === Sexo.FEMININO
        ? "F"
        : "O",
  estado_civil: formData.estadoCivil || undefined,
  profissao: formData.profissao || undefined,
  telefone: onlyDigits(formData.telefone || "", 11) || undefined,
  celular: onlyDigits(formData.telefone || "", 11) || undefined,
  endereco: formData.endereco.logradouro || undefined,
  numero: formData.endereco.numero || undefined,
  complemento: formData.endereco.complemento || undefined,
  bairro: formData.endereco.bairro || undefined,
  cidade: formData.endereco.cidade || undefined,
  estado: formData.endereco.estado || undefined,
  cep: onlyDigits(formData.endereco.cep || "", 8) || undefined,
  diagnostico: formData.diagnosticoOncologico || undefined,
  hospital_tratamento: formData.setor || undefined,
  medico_responsavel: formData.medicoResponsavel || undefined,
  data_inicio_tratamento: formData.dataInicioTratamento || undefined,
  id_origem: formData.numeroSUS || undefined,
} as const;

if (modo === "criar") {
  const novoApi = await criarPacienteMutation.mutateAsync({
    ...basePayload,
    status: "ativo",
  });

  const novoId = (novoApi as any)?.id ?? (novoApi as any)?.id_origem;

  router.push(`/pacientes/${novoId}`);
} else if (paciente) {
  await atualizarPacienteMutation.mutateAsync({
    id: paciente.id,
    payload: basePayload,
  });

  router.push(`/pacientes/${paciente.id}`);
}
```

Note: edit payload intentionally omits `status`.

- [ ] **Step 3: Commit**

```bash
git add components/pacientes/paciente-form.tsx
git commit -m "fix: omit status from paciente edit payload"
```

---

### Task 9: Migrate `app/dashboard/page.tsx`

**Files:**
- Modify: `web/app/dashboard/page.tsx`

- [ ] **Step 1: Replace `useData` patient stats**

Remove:
```typescript
import { useData } from '@/contexts/data-context'
```

Add:
```typescript
import { usePacientes } from '@/hooks/use-pacientes'
import { computePacienteStats } from '@/lib/pacientes-utils'
```

Replace:
```typescript
const { getStats } = useData()
const stats = getStats()
```

With:
```typescript
const { pacientes } = usePacientes()
const { totalPacientes, pacientesAtivos, pacientesSuspensos, pacientesEncerrados } =
  computePacienteStats(pacientes)
```

Update card references:
- `stats.totalPacientes` → `totalPacientes`
- `stats.pacientesAtivos` → `pacientesAtivos`
- `stats.pacientesSuspensos` → `pacientesSuspensos`
- `stats.pacientesEncerrados` → `pacientesEncerrados`

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "refactor: load dashboard patient stats from api"
```

---

### Task 10: Migrate `app/relatorios/page.tsx`

**Files:**
- Modify: `web/app/relatorios/page.tsx`

- [ ] **Step 1: Replace `useData` with `usePacientes`**

Remove:
```typescript
import { useData } from "@/contexts/data-context";
```

Add:
```typescript
import { usePacientes } from "@/hooks/use-pacientes";
import { StatusPaciente } from "@/types";
```

Replace:
```typescript
const { pacientes } = useData();
```

With:
```typescript
const { pacientes } = usePacientes();
```

- [ ] **Step 2: Use `StatusPaciente` enum in pie chart data**

Replace `pacientesPorStatus` (lines 112–119):

```typescript
const pacientesPorStatus = [
  {
    name: "Ativos",
    value: pacientes.filter((p) => p.status === StatusPaciente.ATIVO).length,
  },
  {
    name: "Suspensos",
    value: pacientes.filter((p) => p.status === StatusPaciente.SUSPENSO).length,
  },
  {
    name: "Encerrados",
    value: pacientes.filter((p) => p.status === StatusPaciente.ENCERRADO).length,
  },
].filter((item) => item.value > 0);
```

Search the file for any other raw string status comparisons (`"ativo"`, `"suspenso"`, `"encerrado"`) in patient filters/summary cards and replace with `StatusPaciente` enum values.

- [ ] **Step 3: Commit**

```bash
git add app/relatorios/page.tsx
git commit -m "refactor: load relatorios patient data from api"
```

---

### Task 11: Mock and context cleanup

**Files:**
- Delete: `web/mocks/pacientes.ts`
- Modify: `web/mocks/index.ts`
- Modify: `web/contexts/data-context.tsx`

- [ ] **Step 1: Delete mock file and remove export**

Delete `web/mocks/pacientes.ts`.

In `web/mocks/index.ts`, remove the line:
```typescript
export { pacientesMock } from './pacientes'
```

- [ ] **Step 2: Remove `alterarStatusPaciente` from data context**

In `web/contexts/data-context.tsx`:

1. Remove from `DataContextType` interface (lines ~296–300):
```typescript
alterarStatusPaciente: (
  id: string,
  novoStatus: StatusPaciente,
  usuarioNome: string,
) => Promise<void>;
```

2. Remove implementation (lines ~709–714):
```typescript
const alterarStatusPaciente = useCallback(
  async (id: string, novoStatus: StatusPaciente, _usuarioNome: string) => {
    await updatePaciente(id, { status: novoStatus });
  },
  [updatePaciente],
);
```

3. Remove from provider value (line ~956):
```typescript
alterarStatusPaciente,
```

Keep `mapStatusPacienteToApiStatus` — still referenced by `mapPacienteToApiPayload` in `updatePaciente`.

- [ ] **Step 3: Verify no remaining references**

Run: `cd web && rg "alterarStatusPaciente|pacientesMock" --glob '*.{ts,tsx}'`
Expected: only matches in `docs/` (no code references)

- [ ] **Step 4: Run full test suite and TypeScript**

Run: `cd web && npm test`
Expected: all tests pass

Run: `cd web && npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 5: Commit**

```bash
git add mocks/index.ts contexts/data-context.tsx
git rm mocks/pacientes.ts
git commit -m "chore: remove paciente mock and context status mutation"
```

---

### Task 12: Manual verification

**Credentials:** `gestor@email.com` / `123`

Prerequisites: API running at `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`), web dev server running.

- [ ] **Step 1: Status change via PATCH endpoint**

1. Open an active patient at `/pacientes/[id]`
2. Click **Alterar Status** → select **Suspenso** → confirm
3. Badge updates to Suspenso immediately (not Encerrado — validates mapper + PATCH fix)

- [ ] **Step 2: Histórico auto-entry**

1. Open **Histórico** tab
2. Confirm `ALTERACAO_STATUS` entry appears after status change

- [ ] **Step 3: Free transitions**

1. Change Suspenso → Ativo → works
2. Change Ativo → Encerrado → badge shows Encerrado

- [ ] **Step 4: Edit form preserves status**

1. Open encerrado patient → **Editar** → save without changes
2. Return to detail → status remains Encerrado (not reset to Ativo)

- [ ] **Step 5: Dashboard and relatórios**

1. `/dashboard` status cards reflect updated counts
2. `/relatorios` pie chart reflects updated distribution

- [ ] **Step 6: List filter**

1. `/pacientes` → filter by status → suspended/closed patients appear correctly

- [ ] **Step 7: Permission gate (if prefeitura user available)**

1. Login as prefeitura user → `/pacientes/[id]` → **Alterar Status** button hidden, badge still visible

---

## Self-Review

| Spec requirement | Task |
|------------------|------|
| `PATCH /pacientes/:id/status` | Task 2, 3, 5 |
| Status mapper bug fix (`inativo` → SUSPENSO) | Task 1, 3 |
| `usePaciente(id)` hook | Task 3 |
| `podeAlterarStatusPaciente` | Task 4, 6 |
| Modal rewire | Task 5 |
| Detail + edit pages off `useData` | Task 6, 7 |
| Form omit status on edit | Task 8 |
| Dashboard stats from API | Task 9 |
| Relatórios from API | Task 10 |
| Delete `mocks/pacientes.ts` | Task 11 |
| Remove `alterarStatusPaciente` from context | Task 11 |
| Cross-invalidation (`pacientes`, `historico`) | Task 3 |
| Manual verification checklist | Task 12 |

**Gaps:** None — API auth enforcement, Swagger, PUT bypass, and automated E2E tests are explicitly out of scope per spec.
