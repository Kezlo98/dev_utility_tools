import { Clock } from "lucide-react";

import type { Tool } from "@/lib/types";
import TimestampTool from "./timestamp-tool";

/** Timestamp converter tool barrel. */
export const timestampTools: Tool[] = [
  {
    id: "timestamp",
    name: "Timestamp",
    icon: Clock,
    category: "generators",
    keywords: ["timestamp", "unix", "epoch", "iso", "date", "utc"],
    component: TimestampTool,
  },
];
