import { Search } from "lucide-react";
import { describe, expect, it } from "vitest";

import { filterTools } from "./tool-search";
import type { Tool } from "./types";

const Component = () => null;
const tools: Tool[] = [
  {
    id: "json",
    name: "JSON Formatter",
    icon: Search,
    category: "format-validate",
    component: Component,
    keywords: ["validate", "pretty"],
  },
  {
    id: "uuid",
    name: "UUID Generator",
    icon: Search,
    category: "generators",
    component: Component,
  },
];

describe("filterTools", () => {
  it("returns all tools for an empty query", () => {
    expect(filterTools(tools, "  ")).toBe(tools);
  });

  it("matches names case-insensitively", () => {
    expect(filterTools(tools, "uuid")).toEqual([tools[1]]);
  });

  it("matches keywords with surrounding whitespace ignored", () => {
    expect(filterTools(tools, " PRETTY ")).toEqual([tools[0]]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterTools(tools, "cron")).toEqual([]);
  });
});
