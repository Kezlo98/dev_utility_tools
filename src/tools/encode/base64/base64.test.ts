import { describe, it, expect } from "vitest";

import { transformBase64, encodeBase64, decodeBase64 } from "./base64";

describe("base64", () => {
  it("round-trips ASCII input", () => {
    const encoded = encodeBase64("hello world");
    expect(encoded).toBe("aGVsbG8gd29ybGQ=");
    const { output, error } = decodeBase64(encoded);
    expect(error).toBeNull();
    expect(output).toBe("hello world");
  });

  it("round-trips UTF-8 (multibyte) input", () => {
    const text = "héllo 世界 ✓";
    const { output, error } = transformBase64(transformBase64(text, "encode").output, "decode");
    expect(error).toBeNull();
    expect(output).toBe(text);
  });

  it("returns a readable error for non-Base64 input on decode", () => {
    const { output, error } = transformBase64("this is not!!! base64", "decode");
    expect(output).toBe("");
    expect(error).not.toBeNull();
  });

  it("surfaces an error (not silent garbage) when decoding non-UTF-8 bytes", () => {
    // "/////w==" decodes to bytes ff ff ff ff — invalid UTF-8.
    const { output, error } = transformBase64("/////w==", "decode");
    expect(output).toBe("");
    expect(error).not.toBeNull();
    expect(error).toMatch(/UTF-8|binary/i);
  });

  it("treats empty input as no-op", () => {
    expect(transformBase64("", "encode")).toEqual({ output: "", error: null });
  });
});
