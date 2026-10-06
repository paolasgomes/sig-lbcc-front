import { describe, expect, it } from "vitest";
import {
  formatDateOnly,
  getStatusPrazoClassName,
  getStatusPrazoLabel,
} from "./prazo-utils";

describe("formatDateOnly", () => {
  it("formats the deadline in Brazilian format without timezone conversion", () => {
    expect(formatDateOnly("2026-10-02")).toBe("02/10/2026");
    expect(formatDateOnly("2026-10-02T00:00:00.000Z")).toBe("02/10/2026");
  });
});

describe("deadline status presentation", () => {
  it("uses the expected labels", () => {
    expect(getStatusPrazoLabel("normal")).toBe("Normal");
    expect(getStatusPrazoLabel("proxima_expiracao")).toBe("Próxima à expiração");
    expect(getStatusPrazoLabel("atrasada")).toBe("Atrasada");
  });

  it("keeps visual severity for each status", () => {
    expect(getStatusPrazoClassName("normal")).toContain("success");
    expect(getStatusPrazoClassName("proxima_expiracao")).toContain("warning");
    expect(getStatusPrazoClassName("atrasada")).toContain("destructive");
  });
});
