# Plano de Integração: Módulo de Áreas

---

## TL;DR

Migrar o módulo de Áreas de operações síncronas com mocks para integração completa com API backend. A implementação segue 4 fases: (1) criar service layer com CRUD, (2) migrar data context para async, (3) atualizar UI com loading/error states, (4) validar integração. Estimado **4-6 horas** de desenvolvimento.

---

## I. Mapeamento Técnico da API

### Endpoints Identificados

| Método | Endpoint      | Descrição              | Request                       | Response            |
| ------ | ------------- | ---------------------- | ----------------------------- | ------------------- |
| GET    | `/areas`      | Listar todas           | —                             | `AreaAtendimento[]` |
| POST   | `/areas`      | Criar área             | `{nome, descricao, ativa?}`   | `AreaAtendimento`   |
| GET    | `/areas/{id}` | Buscar por ID          | —                             | `AreaAtendimento`   |
| PUT    | `/areas/{id}` | Atualizar              | `{nome?, descricao?, ativa?}` | `AreaAtendimento`   |
| DELETE | `/areas/{id}` | Inativar (soft delete) | —                             | HTTP 200 ou 204     |

### Campos da API

```typescript
ApiAreaDTO {
  id: string
  nome: string
  descricao: string
  ativa: boolean
  created_at: string
  updated_at: string
}
```

### Relacionamentos Impactados

- **Cotações**: campo `areaAtendimentoId`
- **Atendimentos**: provavelmente `areaAtendimentoId`
- **Fornecedores**: provavelmente `areaAtendimentoId`

---

## II. Status Atual do Codebase

✅ **Já Existe:**

- `app/areas/page.tsx` — página pronta (mas com mocks)
- `types/index.ts` — interface `AreaAtendimento` definida
- `mocks/areas.ts` — 5 áreas de exemplo
- `contexts/data-context.tsx` — métodos CRUD síncronos

❌ **Precisa Criar:**

- `services/areas-service.ts` — camada de API

⚠️ **Precisa Atualizar:**

- `contexts/data-context.tsx` — migrar de sync para async
- `app/areas/page.tsx` — adicionar loading/error states

---

## III. Plano por Fases

### **FASE 1: Camada de Serviço** (~1-2h)

1. **Criar `services/areas-service.ts`:**
   - Definir `ApiAreaDTO` interface
   - Definir `AreaCreateInput`, `AreaUpdateInput` tipos
   - Implementar 5 funções CRUD assíncronas:
     - `listarAreas()` → GET /areas
     - `obterArea(id)` → GET /areas/{id}
     - `criarArea(dados)` → POST /areas
     - `atualizarArea(id, dados)` → PUT /areas/{id}
     - `inativarArea(id)` → DELETE /areas/{id}
   - Adicionar `mapApiAreaToArea()` (transforma DTO em domain type)
   - Tratamento de erros robusto com mensagens descritivas

2. **Atualizar `types/index.ts`:**
   - Adicionar `ApiAreaDTO` interface
   - Adicionar `AreaCreateInput`, `AreaUpdateInput` tipos

### **FASE 2: Camada de Dados** (~1-2h)

1. **Migrar `contexts/data-context.tsx` para async:**
   - Adicionar states: `areasLoading: boolean`, `areasError: string | null`
   - Implementar `refreshAreas()` assíncrono
   - Converter para async:
     - `addArea()` → chama `criarArea()`, mapeia, insere no state
     - `updateArea()` → chama `atualizarArea()`, mapeia, atualiza state
     - `deleteArea()` → `inativarArea()` → chama API, marca como inativa
   - Adicionar call a `refreshAreas()` no `useEffect` de auto-load (quando usuário faz login)
   - Não quebrar integrações com Cotações/Atendimentos que já usam `areaAtendimentoId`

### **FASE 3: Interface & UX** (~1-2h)

1. **Atualizar `app/areas/page.tsx`:**
   - Adicionar skeleton loader durante `areasLoading`
   - Exibir alert de erro quando `areasError` existir
   - Converter handlers para `async/await`
   - Adicionar feedback visual após submit (toast ou mensagem)
   - Adicionar estado de loading no botão de submit
   - (Opcional) Botão de "Recarregar" manual

2. **(Opcional) Criar `components/areas/area-form.tsx`:**
   - Extrair form da página para reutilização
   - Padrão: similar a `components/pacientes/paciente-form.tsx`
   - Props: `mode: "criar" | "editar"`, `area?: AreaAtendimento`

### **FASE 4: Validação** (~1h)

Testar e validar:

- [ ] Listar áreas carrega **da API** (não mocks)
- [ ] Criar área persiste no backend
- [ ] Editar área atualiza dados
- [ ] Deletar (inativar) muda `ativa: false`
- [ ] Mensagens de erro exibem corretamente
- [ ] Loading states funcionam
- [ ] Áreas carregam ao fazer login
- [ ] Cotações/Atendimentos/Fornecedores não quebram

---

## IV. Padrões a Replicar

Seguir exatamente o mesmo padrão de **Pacientes** e **Produtos** já implementados:

```typescript
// Service: chamadas HTTP com tipagem
export async function listarAreas() {
  const response = await api.get<ApiAreaDTO[]>("/areas");
  return response.data;
}

// Mapping: DTO → Domain
function mapApiAreaToArea(apiArea: ApiAreaDTO): AreaAtendimento { ... }

// Context: async com loading/error
const refreshAreas = useCallback(async () => {
  setAreasLoading(true);
  try {
    const dados = await listarAreas();
    setAreas(dados.map(mapApiAreaToArea));
  } catch (error) {
    setAreasError(error instanceof Error ? error.message : "Erro...");
  }
}, []);

// Auto-load no login
useEffect(() => {
  if (usuario) void refreshAreas();
}, [usuario]);
```

---

## V. Arquivos a Modificar/Criar

| Arquivo                          | Ação                 | Tamanho     | Prioridade |
| -------------------------------- | -------------------- | ----------- | ---------- |
| `services/areas-service.ts`      | **CRIAR**            | ~100 linhas | 🔴 Alta    |
| `types/index.ts`                 | **MODIFICAR**        | +10 linhas  | 🔴 Alta    |
| `contexts/data-context.tsx`      | **MODIFICAR**        | ~50 linhas  | 🔴 Alta    |
| `app/areas/page.tsx`             | **MODIFICAR**        | ~20 linhas  | 🟡 Média   |
| `components/areas/area-form.tsx` | **CRIAR** (opcional) | ~150 linhas | 🟢 Baixa   |

---

## VI. Questões Abertas (a Validar na API)

1. ❓ **Validações**: Campos obrigatórios? Limites de tamanho?
2. ❓ **Integridade**: Ao desativar Área com Cotações ativas, como API responde?
3. ❓ **Metadados**: Há `created_by`, `updated_by`, `deleted_at`?
4. ❓ **Autenticação**: Requer token? Qualquer perfil pode criar/atualizar?
5. ❓ **Ordenação**: Resposta sempre mesma ordem ou pode variar?

---

## VII. Próximos Passos

1. ✅ **Você aprova este plano?**
2. 🔍 **Explorar API Swagger** para confirmar payloads exatos
3. 📝 **Documentação final** com todos os campos confirmados
4. 🚀 **Implementação** (pode ser paralelizada por outro dev)
