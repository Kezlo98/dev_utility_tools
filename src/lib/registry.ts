import type { Tool } from "./types";

import { placeholderTools } from "@/tools/_placeholder";

/**
 * Tool registry. New tools are appended here once their category barrel is
 * imported. Only the placeholder exists during the Phase 2 core-shell; real
 * tools land in Phases 3–6.
 */
const tools: Tool[] = [...placeholderTools];

const byId = new Map<string, Tool>(tools.map((t) => [t.id, t]));

export function getAllTools(): Tool[] {
  return tools;
}

export function getToolById(id: string): Tool | undefined {
  return byId.get(id);
}
