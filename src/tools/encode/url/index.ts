import { Link } from "lucide-react";

import type { Tool } from "@/lib/types";
import UrlTool from "./url-tool";

/** URL encode/decode tool barrel. */
export const urlTools: Tool[] = [
  {
    id: "url",
    name: "URL Encoder",
    icon: Link,
    category: "encode-hash-crypto",
    component: UrlTool,
    keywords: ["url", "uri", "encode", "decode", "percent", "escape", "query"],
  },
];
