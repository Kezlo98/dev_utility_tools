import { describe, it, expect } from "vitest";

import { formatXml } from "./format-xml";

describe("formatXml", () => {
  it("pretty-prints compact XML with a 2-space indent", () => {
    const { output, error } = formatXml('<root><item>hi</item></root>');
    expect(error).toBeNull();
    expect(output).toContain("<root>");
    expect(output).toContain("  <item>hi</item>");
    expect(output).toContain("</root>");
  });

  it("returns a readable error for structurally invalid XML (unclosed CDATA)", () => {
    // fast-xml-parser is lenient about unclosed tags, so a genuinely malformed
    // input here is an unclosed CDATA section, which the parser rejects.
    const { output, error } = formatXml("<a><![CDATA[never closed");
    expect(output).toBe("");
    expect(error).not.toBeNull();
  });

  it("treats empty input as no-op", () => {
    expect(formatXml("")).toEqual({ output: "", error: null });
  });
});
