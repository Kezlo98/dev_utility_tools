import { KeyRound } from "lucide-react";

import type { Tool } from "@/lib/types";
import PasswordTool from "./password-tool";

/** Password generator tool barrel. */
export const passwordTools: Tool[] = [
  {
    id: "password-generator",
    name: "Password Generator",
    icon: KeyRound,
    category: "generators",
    component: PasswordTool,
    keywords: ["password", "generate", "random", "secure", "passphrase"],
  },
];
