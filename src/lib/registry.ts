import type { Tool } from "./types";

import { placeholderTools } from "@/tools/_placeholder";
import { jsonTools } from "@/tools/format/json";
import { yamlTools } from "@/tools/format/yaml";
import { xmlTools } from "@/tools/format/xml";
import { sqlTools } from "@/tools/format/sql";
import { base64Tools } from "@/tools/encode/base64";
import { urlTools } from "@/tools/encode/url";
import { uuidTools } from "@/tools/generators/uuid";
import { qrTools } from "@/tools/generators/qr";
import { timestampTools } from "@/tools/generators/timestamp";
import { passwordTools } from "@/tools/generators/password";
import { caseTools } from "@/tools/text/case";
import { diffTools } from "@/tools/text/diff";
import { regexTools } from "@/tools/text/regex";

/**
 * Tool registry. New tools are appended here once their category barrel is
 * imported. Phase 4 adds the Generators + Text & Dev waves.
 */
const tools: Tool[] = [
  ...placeholderTools,
  ...jsonTools,
  ...yamlTools,
  ...xmlTools,
  ...sqlTools,
  ...base64Tools,
  ...urlTools,
  ...uuidTools,
  ...qrTools,
  ...timestampTools,
  ...passwordTools,
  ...caseTools,
  ...diffTools,
  ...regexTools,
];

const byId = new Map<string, Tool>(tools.map((t) => [t.id, t]));

export function getAllTools(): Tool[] {
  return tools;
}

export function getToolById(id: string): Tool | undefined {
  return byId.get(id);
}
