import { CaseSensitive } from "lucide-react";

import type { Tool } from "@/lib/types";
import CaseTool from "./case-tool";

/** Case converter tool barrel. */
export const caseTools: Tool[] = [
  {
    id: "case-converter",
    name: "Case Converter",
    icon: CaseSensitive,
    category: "text-dev",
    component: CaseTool,
    keywords: [
      "case",
      "camel",
      "pascal",
      "snake",
      "kebab",
      "constant",
      "title",
    ],
  },
];
