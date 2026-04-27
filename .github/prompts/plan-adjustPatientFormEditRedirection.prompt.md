# Plan: Adjust Patient Form & Fix Edit Redirection

## TL;DR

Remove 4 fields from the patient form that aren't persisted in the API (`naturalidade`, `escolaridade`, `nomePai`, `nomeMae`) and verify the redirect after save uses the correct patient ID. The form will be cleaner, data won't be lost on reload, and the edit flow will confidently navigate to the correct patient detail page.

---

## Steps

### Phase 1: Remove Non-API Fields from Form (Parallel)

1. **Update paciente-form.tsx** – Remove the 4 fields from the form JSX:
   - Remove `naturalidade` field (currently in "Dados Pessoais" section)
   - Remove `escolaridade` field (currently in "Dados Pessoais" section)
   - Remove `nomePai` field (currently in "Dados Pessoais" section)
   - Remove `nomeMae` field (currently in "Dados Pessoais" section)
   - Keep only fields that map to API contract

2. **Update Paciente type** – Verify/clean type definition in types/index.ts:
   - Verify these 4 fields are still optional (they may be used elsewhere)
   - Add comment explaining they're not persisted in API
   - Do NOT remove from type yet (may break other components) — mark as deprecated if used elsewhere

3. **Update form validation schema** (if Zod/yup exists in paciente-form.tsx):
   - Remove validation rules for these 4 fields if present
   - Update form submit logic to not include them

### Phase 2: Verify & Fix Redirect Logic (Depends on Phase 1)

4. **Audit redirect in paciente-form.tsx**:
   - Locate form submit handler (likely in `handleSubmit` or `onSubmit`)
   - Verify it captures the correct patient ID from response:
     - For **create**: Extract `id` from API response after POST, use in redirect `/pacientes/{newId}`
     - For **edit**: Extract `id` from the patient being edited, use in redirect `/pacientes/{currentId}`
   - Confirm no hardcoded IDs or empty ID fallbacks
   - Add console logging or error state if redirect ID is missing

5. **Verify pages call form correctly**:
   - app/pacientes/novo/page.tsx – confirm `PacienteForm` modo="criar" and redirect uses returned ID
   - app/pacientes/[id]/editar/page.tsx – confirm `PacienteForm` passes current `id` and redirect uses same `id`
   - Add error boundary or fallback if ID missing

### Phase 3: Test & Validate (Depends on Phase 2)

6. **Verification steps**:
   - Create flow: Navigate to `/pacientes/novo` → fill form → submit → verify redirect to `/pacientes/{NEW_ID_HERE}` (not empty, not old ID)
   - Edit flow: Navigate to `/pacientes/123/editar` → edit field → submit → verify redirect to `/pacientes/123` (same ID)
   - No blank fields: View patient detail after edit → confirm no "-" or blank values for removed fields
   - Data persists: Reload patient detail page → confirm edited data is still displayed (no data loss)
   - Manual QA: Test on browsers/devices if needed

---

## Relevant Files

- components/pacientes/paciente-form.tsx — Remove 4 fields from JSX, verify redirect logic
- app/pacientes/novo/page.tsx — Ensure redirects to new patient detail correctly
- app/pacientes/[id]/editar/page.tsx — Ensure redirects to same patient detail correctly
- app/pacientes/[id]/page.tsx — Detail page (no changes needed)
- types/index.ts — Mark non-API fields as deprecated (optional cleanup)
- services/pacientes-service.ts — Verify API contract (likely no changes)

---

## Verification

1. **Create flow**: Navigate to `/pacientes/novo` → fill form → submit → verify redirect to `/pacientes/{NEW_ID_HERE}` (not empty, not old ID)
2. **Edit flow**: Navigate to `/pacientes/123/editar` → edit field → submit → verify redirect to `/pacientes/123` (same ID)
3. **No blank fields**: View patient detail after edit → confirm no "-" or blank values for removed fields
4. **Data persists**: Reload patient detail page → confirm edited data is still displayed (no data loss)
5. **Manual QA**: Test on browsers/devices if needed

---

## Decisions

- **Scope**: Only remove the 4 fields not persisted in API (naturalidade, escolaridade, nomePai, nomeMae). Do NOT refactor field name mismatches (numeroSUS/id_origem, setor/hospital_tratamento, etc.) — that's out of scope.
- **Type preservation**: Keep fields in Paciente type as optional to avoid breaking other components that may reference them. Mark as "not persisted in API" via comment.
- **Error handling**: If redirect ID is ever missing/empty, fall back to error state or redirect to patient list (/pacientes).
- **Excluded from scope**:
  - Field name mapping fixes (numeroSUS, setor, areaTratamento)
  - Duplicate field cleanup (diagnostico/diagnosticoOncologico, nome/nomeCompleto)
  - Address validation or defaults
  - Status management changes
