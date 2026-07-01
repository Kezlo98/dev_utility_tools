import { Fingerprint } from "lucide-react";

import type { Tool } from "@/lib/types";
import UuidTool from "./uuid-tool";

/** UUID/ULID generator tool barrel. */
export const uuidTools: Tool[] = [
  {
    id: "uuid-ulid",
    name: "UUID / ULID",
    icon: Fingerprint,
    category: "generators",
    component: UuidTool,
    keywords: ["uuid", "ulid", "guid", "v4", "v7", "identifier"],
  },
];
