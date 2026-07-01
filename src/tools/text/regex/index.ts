import { Regex } from "lucide-react";

import type { Tool } from "@/lib/types";
import RegexTool from "./regex-tool";

/** Regex tester tool barrel. */
export const regexTools: Tool[] = [
  {
    id: "regex-tester",
    name: "Regex Tester",
    icon: Regex,
    category: "text-dev",
    component: RegexTool,
    keywords: ["regex", "pattern", "match", "test", "regexp"],
  },
];
