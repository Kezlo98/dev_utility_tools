import { describe, it, expect } from "vitest";

import { toTimestamp } from "./timestamp";

describe("timestamp", () => {
  it("parses Unix seconds", () => {
    const v = toTimestamp("1700000000");
    expect(v.unixSeconds).toBe(1700000000);
    expect(v.isoUtc).toBe("2023-11-14T22:13:20.000Z");
  });

  it("parses Unix milliseconds", () => {
    const v = toTimestamp("1700000000000");
    expect(v.unixMillis).toBe(1700000000000);
    expect(v.isoUtc).toBe("2023-11-14T22:13:20.000Z");
  });

  it("parses ISO 8601 input back to Unix seconds", () => {
    const v = toTimestamp("2023-11-14T22:13:20Z");
    expect(v.unixSeconds).toBe(1700000000);
  });

  it("returns a readable error for garbage input", () => {
    const v = toTimestamp("not a date");
    expect(v.error).not.toBeNull();
  });

  it("treats empty input as a no-op", () => {
    expect(toTimestamp("").error).toBeNull();
  });
});
