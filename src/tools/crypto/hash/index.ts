import { Hash } from "lucide-react";

import type { Tool } from "@/lib/types";
import HashTool from "./hash-tool";

/** Hash tool barrel (MD5/SHA-1/256/384/512). */
export const hashTools: Tool[] = [
  {
    id: "hash",
    name: "Hash",
    icon: Hash,
    category: "encode-hash-crypto",
    component: HashTool,
    keywords: ["hash", "md5", "sha", "checksum", "digest"],
  },
];
