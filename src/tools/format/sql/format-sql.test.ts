import { describe, it, expect } from "vitest";

import { formatSql } from "./format-sql";

describe("formatSql", () => {
  it("uppercases keywords and indents a SELECT", () => {
    const { output, error } = formatSql("select id,name from users where id=1", "postgresql");
    expect(error).toBeNull();
    expect(output).toContain("SELECT");
    expect(output).toContain("FROM");
    expect(output).toContain("WHERE");
  });

  it("reformats across dialects without error", () => {
    for (const lang of ["sql", "mysql", "sqlite", "tsql"] as const) {
      const { error } = formatSql("select * from t", lang);
      expect(error).toBeNull();
    }
  });

  it("treats empty input as no-op", () => {
    expect(formatSql("")).toEqual({ output: "", error: null });
  });
});
