import type { Tool } from "./types";

import { placeholderTools } from "@/tools/_placeholder";
import { jsonTools } from "@/tools/format/json";
import { yamlTools } from "@/tools/format/yaml";
import { xmlTools } from "@/tools/format/xml";
import { sqlTools } from "@/tools/format/sql";
import { base64Tools } from "@/tools/encode/base64";
import { urlTools } from "@/tools/encode/url";

/**
 * Tool registry. New tools are appended here once their category barrel is
 * imported. The placeholder ships with the Phase 2 core-shell; real tools
 * arrive in Phases 3–6 (Format & Encode wave lands here in Phase 3).
 */
const tools: Tool[] = [
  ...placeholderTools,
  ...jsonTools,
  ...yamlTools,
  ...xmlTools,
  ...sqlTools,
  ...base64Tools,
  ...urlTools,
];

const byId = new Map<string, Tool>(tools.map((t) => [t.id, t]));

export function getAllTools(): Tool[] {
  return tools;
}

export function getToolById(id: string): Tool | undefined {
  return byId.get(id);
}
