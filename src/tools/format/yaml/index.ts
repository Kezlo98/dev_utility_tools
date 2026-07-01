import { FileCode } from "lucide-react";

import type { Tool } from "@/lib/types";
import YamlTool from "./yaml-tool";

/** YAML format tool barrel. */
export const yamlTools: Tool[] = [
  {
    id: "yaml",
    name: "YAML Formatter",
    icon: FileCode,
    category: "format-validate",
    component: YamlTool,
    keywords: ["yaml", "yml", "format", "pretty", "beautify", "config"],
  },
];
