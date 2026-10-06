import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/services/api";
import {
  alternarStatusFeriado,
  atualizarFeriado,
} from "@/services/calendario-service";

describe("calendario-service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("envia a nova data no PUT de edição do feriado", async () => {
    const feriado = {
      id: "feriado-1",
      data: "2026-11-02",
      nome: "Finados",
      ativo: true,
      criado_por: null,
      atualizado_por: "gestor-1",
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-05T00:00:00Z",
    };
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: feriado } as never);

    await expect(
      atualizarFeriado("feriado-1", { data: "2026-11-02", nome: "Finados" }),
    ).resolves.toEqual(feriado);

    expect(put).toHaveBeenCalledWith("/calendario/feriados/feriado-1", {
      data: "2026-11-02",
      nome: "Finados",
    });
  });

  it("envia ativo=false no PATCH ao inativar um feriado", async () => {
    const feriado = {
      id: "feriado-1",
      data: "2026-11-02",
      nome: "Finados",
      ativo: false,
      criado_por: null,
      atualizado_por: "gestor-1",
      created_at: "2026-10-01T00:00:00Z",
      updated_at: "2026-10-05T00:00:00Z",
    };
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: feriado } as never);

    await expect(alternarStatusFeriado("feriado-1", false)).resolves.toEqual(feriado);

    expect(patch).toHaveBeenCalledWith("/calendario/feriados/feriado-1/status", {
      ativo: false,
    });
  });
});
