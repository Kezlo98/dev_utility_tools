import type { Tool } from "@/lib/types";

export function filterTools(tools: Tool[], query: string): Tool[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return tools;

  return tools.filter((tool) =>
    [tool.name, ...(tool.keywords ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
}
