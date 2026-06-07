import { describe, it, expect, vi, afterEach } from "vitest";
import { isCotacaoVencida } from "./cotacoes-utils";

describe("isCotacaoVencida", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false when dataValidade is today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-07T12:00:00"));

    expect(isCotacaoVencida("2026-06-07")).toBe(false);
  });

  it("returns true when dataValidade is before today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-07T12:00:00"));

    expect(isCotacaoVencida("2026-06-06")).toBe(true);
  });

  it("returns false when dataValidade is after today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-07T12:00:00"));

    expect(isCotacaoVencida("2026-06-08")).toBe(false);
  });

  it("compares date-only ignoring time portion", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-07T23:59:59"));

    expect(isCotacaoVencida("2026-06-07T00:00:00.000Z")).toBe(false);
  });
});
