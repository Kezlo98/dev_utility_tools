import { QrCode } from "lucide-react";

import type { Tool } from "@/lib/types";
import QrTool from "./qr-tool";

/** QR code generator tool barrel. */
export const qrTools: Tool[] = [
  {
    id: "qr-code",
    name: "QR Code",
    icon: QrCode,
    category: "generators",
    component: QrTool,
    keywords: ["qr", "qrcode", "barcode", "image"],
  },
];
