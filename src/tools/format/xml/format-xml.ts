import { XMLParser, XMLBuilder } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

/**
 * XML formatter. Parses then re-emits with 2-space indentation. Attribute
 * values are preserved under the `@_` prefix, matching the parser's default
 * so round-trips stay faithful for the formatting use case.
 */
export function formatXml(input: string): { output: string; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { output: "", error: null };
  try {
    const obj = parser.parse(trimmed);
    const builder = new XMLBuilder({ format: true, indentBy: "  ", ignoreAttributes: false, attributeNamePrefix: "@_" });
    return { output: builder.build(obj), error: null };
  } catch (e) {
    return { output: "", error: e instanceof Error ? e.message : String(e) };
  }
}
