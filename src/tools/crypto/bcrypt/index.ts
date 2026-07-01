import { ShieldCheck } from "lucide-react";

import type { Tool } from "@/lib/types";
import BcryptTool from "./bcrypt-tool";

/** bcrypt tool barrel. */
export const bcryptTools: Tool[] = [
  {
    id: "bcrypt",
    name: "bcrypt",
    icon: ShieldCheck,
    category: "encode-hash-crypto",
    component: BcryptTool,
    keywords: ["bcrypt", "password", "hash", "salt", "cost"],
  },
];
