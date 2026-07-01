import { v4, v7 } from "uuid";
import { ulid } from "ulid";

export type UuidKind = "v4" | "v7" | "ulid";

/** RFC 4122 v4 shape check (version + variant nibbles). */
const V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Generate a single id of the requested kind. */
export function generateOne(kind: UuidKind): string {
  switch (kind) {
    case "v4":
      return v4();
    case "v7":
      return v7();
    case "ulid":
      return ulid();
  }
}

/** Clamp count to the 1–100 bulk range and join with newlines. */
export function generateBulk(kind: UuidKind, count: number): string {
  const n = Math.max(1, Math.min(100, Math.trunc(count) || 1));
  return Array.from({ length: n }, () => generateOne(kind)).join("\n");
}

export function isV4(value: string): boolean {
  return V4_RE.test(value);
}
