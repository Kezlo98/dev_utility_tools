import { GitCompare } from "lucide-react";

import type { Tool } from "@/lib/types";
import DiffTool from "./diff-tool";

/** Text diff tool barrel. */
export const diffTools: Tool[] = [
  {
    id: "text-diff",
    name: "Text Diff",
    icon: GitCompare,
    category: "text-dev",
    component: DiffTool,
    keywords: ["diff", "compare", "changes", "delta", "git"],
  },
];
