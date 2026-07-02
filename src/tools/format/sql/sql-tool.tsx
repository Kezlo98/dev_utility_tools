import { useMemo, useState } from "react";

import { ToolIoPanels } from "@/components/tool-io-panels";
import {
  formatSql,
  SQL_LANGUAGES,
  SQL_LANGUAGE_LABELS,
  type SqlLanguage,
} from "./format-sql";

/** SQL pretty-printer with a dialect selector. */
export default function SqlTool() {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<SqlLanguage>("sql");

  const { output, error } = useMemo(
    () => formatSql(input, language),
    [input, language],
  );

  return (
    <ToolIoPanels
      input={input}
      onInputChange={setInput}
      output={output}
      error={error}
      controls={
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Dialect
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SqlLanguage)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SQL_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {SQL_LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>
        </label>
      }
      inputPlaceholder="select * from users where id=1 order by name"
      outputPlaceholder="Formatted SQL appears here…"
    />
  );
}
