import { Binary } from "lucide-react";

import type { Tool } from "@/lib/types";
import Base64Tool from "./base64-tool";

/** Base64 encode/decode tool barrel. */
export const base64Tools: Tool[] = [
  {
    id: "base64",
    name: "Base64",
    icon: Binary,
    category: "encode-hash-crypto",
    component: Base64Tool,
    keywords: ["base64", "encode", "decode", "b64", "binary"],
  },
];
