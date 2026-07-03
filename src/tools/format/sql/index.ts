import { Database } from "lucide-react";

import type { Tool } from "@/lib/types";
import SqlTool from "./sql-tool";

/** SQL format tool barrel. */
export const sqlTools: Tool[] = [
  {
    id: "sql",
    name: "SQL Formatter",
    icon: Database,
    category: "format-validate",
    component: SqlTool,
    keywords: [
      "sql",
      "format",
      "pretty",
      "beautify",
      "query",
      "postgres",
      "mysql",
      "sqlite",
      "tsql",
    ],
  },
];
