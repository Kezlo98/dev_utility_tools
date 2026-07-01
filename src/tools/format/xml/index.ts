import { FileCode2 } from "lucide-react";

import type { Tool } from "@/lib/types";
import XmlTool from "./xml-tool";

/** XML format tool barrel. */
export const xmlTools: Tool[] = [
  {
    id: "xml",
    name: "XML Formatter",
    icon: FileCode2,
    category: "format-validate",
    component: XmlTool,
    keywords: ["xml", "format", "pretty", "beautify", "svg", "html"],
  },
];
