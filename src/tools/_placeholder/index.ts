import { Wrench } from "lucide-react";

import type { Tool } from "@/lib/types";
import PlaceholderTool from "./placeholder-tool";

/**
 * Placeholder tool barrel. Smoke-tests the core shell. Replaced by real tools
 * in Phases 3–6.
 */
export const placeholderTools: Tool[] = [
  {
    id: "placeholder",
    name: "Placeholder",
    icon: Wrench,
    category: "text-dev",
    component: PlaceholderTool,
    keywords: ["demo", "test", "echo"],
  },
];
