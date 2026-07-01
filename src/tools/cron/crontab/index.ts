import { ListChecks } from "lucide-react";

import type { Tool } from "@/lib/types";
import CrontabTool from "./crontab-tool";

/** Crontab validator barrel. */
export const crontabTools: Tool[] = [
  {
    id: "crontab",
    name: "Crontab",
    icon: ListChecks,
    category: "cron",
    keywords: ["crontab", "cron", "schedule"],
    component: CrontabTool,
  },
];
