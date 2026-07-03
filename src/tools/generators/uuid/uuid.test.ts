import { describe, it, expect } from "vitest";

import { generateOne, generateBulk, isV4, type UuidKind } from "./uuid";

describe("uuid generator", () => {
  it.each<UuidKind>(["v4", "v7", "ulid"])(
    "produces non-empty ids for %s",
    (kind) => {
      const id = generateOne(kind);
      expect(id.length).toBeGreaterThan(10);
    },
  );

  it("emits v4 ids matching the RFC shape", () => {
    expect(isV4(generateOne("v4"))).toBe(true);
  });

  it("produces 100 unique sequential v4 ids", () => {
    const seen = new Set(generateBulk("v4", 100).split("\n"));
    expect(seen.size).toBe(100);
    for (const id of seen) expect(isV4(id)).toBe(true);
  });

  it("clamps count to the 1–100 range", () => {
    expect(generateBulk("v4", 0).split("\n")).toHaveLength(1);
    expect(generateBulk("v4", 9999).split("\n")).toHaveLength(100);
    expect(generateBulk("v4", 5.9).split("\n")).toHaveLength(5);
  });

  it("v7 ids are time-sortable (monotonic within a millisecond burst)", () => {
    const ids = generateBulk("v7", 50).split("\n");
    expect(ids).toEqual([...ids].sort());
  });
});
