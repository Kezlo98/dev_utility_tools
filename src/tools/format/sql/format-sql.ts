import { format } from "sql-formatter";

/** SQL dialects exposed by the language dropdown. */
export const SQL_LANGUAGES = ["sql", "postgresql", "mysql", "sqlite", "tsql"] as const;
export type SqlLanguage = (typeof SQL_LANGUAGES)[number];

export const SQL_LANGUAGE_LABELS: Record<SqlLanguage, string> = {
  sql: "Standard SQL",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  sqlite: "SQLite",
  tsql: "T-SQL (SQL Server)",
};

/**
 * SQL formatter. Uppercases keywords and indents with 2 spaces. `sql-formatter`
 * is permissive with partial statements, so most input reformats cleanly; a
 * genuinely unsupported token surfaces as a readable error.
 */
export function formatSql(
  input: string,
  language: SqlLanguage = "sql",
): { output: string; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { output: "", error: null };
  try {
    return {
      output: format(trimmed, { language, keywordCase: "upper", tabWidth: 2 }),
      error: null,
    };
  } catch (e) {
    return { output: "", error: e instanceof Error ? e.message : String(e) };
  }
}
