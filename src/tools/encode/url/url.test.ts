import { describe, it, expect } from "vitest";

import { transformUrl } from "./url";

describe("url", () => {
  it("round-trips text with reserved characters", () => {
    const text = "a b&c=d?e/f#g";
    const encoded = transformUrl(text, "encode").output;
    expect(encoded).toBe("a%20b%26c%3Dd%3Fe%2Ff%23g");
    const { output, error } = transformUrl(encoded, "decode");
    expect(error).toBeNull();
    expect(output).toBe(text);
  });

  it("round-trips UTF-8 input", () => {
    const text = "café ☕/naïve";
    const { output, error } = transformUrl(
      transformUrl(text, "encode").output,
      "decode",
    );
    expect(error).toBeNull();
    expect(output).toBe(text);
  });

  it("returns a readable error for a malformed percent-escape", () => {
    const { output, error } = transformUrl("bad%zz", "decode");
    expect(output).toBe("");
    expect(error).not.toBeNull();
  });

  it("treats empty input as no-op", () => {
    expect(transformUrl("", "encode")).toEqual({ output: "", error: null });
  });
});
