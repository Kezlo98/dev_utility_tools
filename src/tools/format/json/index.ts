import { Braces } from "lucide-react";

import type { Tool } from "@/lib/types";
import JsonTool from "./json-tool";

/** JSON format tool barrel. */
export const jsonTools: Tool[] = [
  {
    id: "json",
    name: "JSON Formatter",
    icon: Braces,
    category: "format-validate",
    component: JsonTool,
    keywords: ["json", "format", "pretty", "beautify", "minify", "parse"],
  },
];
