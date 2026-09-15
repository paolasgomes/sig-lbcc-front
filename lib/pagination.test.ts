import { describe, expect, it } from "vitest";
import { getPaginationItems } from "./pagination";

describe("getPaginationItems", () => {
  it("returns an empty list when there are no pages", () => {
    expect(getPaginationItems(1, 0)).toEqual([]);
  });

  it("returns every page when the total fits in the window", () => {
    expect(getPaginationItems(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("keeps the start of a long range compact", () => {
    expect(getPaginationItems(1, 20)).toEqual([
      1,
      2,
      3,
      4,
      5,
      "ellipsis",
      20,
    ]);
  });

  it("keeps the middle of a long range compact", () => {
    expect(getPaginationItems(10, 20)).toEqual([
      1,
      "ellipsis",
      9,
      10,
      11,
      "ellipsis",
      20,
    ]);
  });

  it("keeps the end of a long range compact", () => {
    expect(getPaginationItems(20, 20)).toEqual([
      1,
      "ellipsis",
      16,
      17,
      18,
      19,
      20,
    ]);
  });

  it("clamps a page outside the range", () => {
    expect(getPaginationItems(99, 20)).toEqual([
      1,
      "ellipsis",
      16,
      17,
      18,
      19,
      20,
    ]);
  });
});
