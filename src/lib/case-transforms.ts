/**
 * Case conversions. The input is normalized to a lowercased token array using a
 * heuristic that splits on `_`, `-`, whitespace, and camel/Pascal humps, then
 * re-emitted as six common variants.
 */
export type CaseKind =
  "camel" | "pascal" | "snake" | "kebab" | "constant" | "title";

/** Split an arbitrary string into lowercased word tokens. */
export function tokenize(input: string): string[] {
  if (!input) return [];
  const spaced = input
    // camelHumps: "fooBar" → "foo Bar", "fooBarBaz" → "foo Bar Baz".
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
    // Acronym followed by a word: "XMLParser" → "XML Parser".
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, "$1 $2");
  return spaced
    .split(/[\s_.-]+/u)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

const cap = (word: string) =>
  word ? word.charAt(0).toUpperCase() + word.slice(1) : word;

/** Convert a token array into a given case variant. */
export function toCase(tokens: string[], kind: CaseKind): string {
  switch (kind) {
    case "camel":
      return tokens.map((t, i) => (i === 0 ? t : cap(t))).join("");
    case "pascal":
      return tokens.map(cap).join("");
    case "snake":
      return tokens.join("_");
    case "kebab":
      return tokens.join("-");
    case "constant":
      return tokens.map((t) => t.toUpperCase()).join("_");
    case "title":
      return tokens.map(cap).join(" ");
  }
}

/** Produce all six variants for an input string at once. */
export function convertCase(input: string): Record<CaseKind, string> {
  const tokens = tokenize(input);
  return {
    camel: toCase(tokens, "camel"),
    pascal: toCase(tokens, "pascal"),
    snake: toCase(tokens, "snake"),
    kebab: toCase(tokens, "kebab"),
    constant: toCase(tokens, "constant"),
    title: toCase(tokens, "title"),
  };
}
