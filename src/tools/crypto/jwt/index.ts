import { FileKey } from "lucide-react";

import type { Tool } from "@/lib/types";
import JwtTool from "./jwt-tool";

/** JWT decode/verify tool barrel (symmetric HS* only in bootstrap). */
export const jwtTools: Tool[] = [
  {
    id: "jwt",
    name: "JWT",
    icon: FileKey,
    category: "encode-hash-crypto",
    component: JwtTool,
    keywords: ["jwt", "token", "jose", "decode", "verify"],
  },
];
