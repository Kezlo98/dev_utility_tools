import { CalendarClock } from "lucide-react";

import type { Tool } from "@/lib/types";
import CronExpressionTool from "./cron-expression-tool";

/** Cron expression explorer barrel. */
export const cronExpressionTools: Tool[] = [
  {
    id: "cron-expression",
    name: "Cron Expression",
    icon: CalendarClock,
    category: "cron",
    keywords: ["cron", "schedule", "expression"],
    component: CronExpressionTool,
  },
];
