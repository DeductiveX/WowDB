import type { SchemaContext } from "./types";

export function serializeSchema(ctx: SchemaContext): string {
  const lines: string[] = [`Database: ${ctx.database}\n`];
  for (const t of ctx.tables) {
    const rowInfo = t.row_count != null ? ` ~${t.row_count} rows` : "";
    lines.push(`TABLE ${t.name} (${t.engine}${rowInfo})${t.comment ? " — " + t.comment : ""}`);
    for (const c of t.columns) {
      const pk = c.key === "PRI" ? " PK" : c.key === "UNI" ? " UNIQUE" : c.key === "MUL" ? " INDEX" : "";
      const null_ = c.nullable ? "" : " NOT NULL";
      const extra = c.extra ? ` [${c.extra}]` : "";
      lines.push(`  ${c.name} ${c.type}${pk}${null_}${extra}`);
    }
    for (const fk of t.foreign_keys) {
      lines.push(`  -- FK: ${fk.column} -> ${fk.references}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export const PROMPTS = {
  nlToSql: (schema: string) =>
    `You are a MySQL SQL generator for a read-only database workbench.\n\nSchema:\n${schema}\n\nRules:\n- Output ONLY the SQL query, no markdown, no backtick fences, no explanation\n- Only SELECT, SHOW, DESCRIBE, EXPLAIN are allowed\n- Use backticks for identifiers\n- Add LIMIT if not specified by the user`,

  explainQuery: (schema: string) =>
    `You are a database expert helping developers understand SQL queries.\n\nSchema:\n${schema}\n\nExplain the given query clearly and concisely:\n- What data it retrieves\n- How each clause contributes\n- Any performance notes\nKeep under 150 words. Use plain language.`,

  explainQueryNoSchema: () =>
    `You are a database expert. Explain the given SQL query clearly:\n- What data it retrieves\n- How each clause works\n- Any performance notes\nKeep under 150 words.`,

  optimizeQuery: (schema: string) =>
    `You are a MySQL performance expert.\n\nSchema:\n${schema}\n\nAnalyze the given query and suggest specific optimizations:\n- Missing indexes (name the exact columns)\n- Query rewrites if applicable\n- Why each change helps\nBe concrete. Reference actual table and column names.`,

  reviewTable: (schema: string) =>
    `You are a database architect reviewing a table schema.\n\nFull schema context:\n${schema}\n\nFor the given table, provide actionable recommendations:\n1. Missing or redundant indexes\n2. Data type improvements\n3. Normalization opportunities\n4. Nullable columns that should be required (or vice-versa)\n5. Any naming or convention issues\nBe specific and practical. Prioritize by impact.`,

  chat: (schema: string) =>
    `You are a helpful database assistant embedded in WowDB, a read-only MySQL workbench.\n\nUser's database schema:\n${schema}\n\nHelp the user:\n- Write and explain SQL queries\n- Understand their data model and relationships\n- Answer questions about the schema\n- Suggest best practices\n\nBe concise and reference actual table/column names when relevant.`,

  generateDocs: (schema: string) =>
    `You are a technical writer specializing in database documentation.\n\nSchema:\n${schema}\n\nGenerate complete Markdown documentation for this database. For each table:\n1. Write a paragraph describing what it stores and its business purpose\n2. Document each column with a brief plain-language description\n3. Note important constraints, relationships, and business rules\n\nFormat as clean Markdown. Use the table names as ## headings and column names in backtick code spans. Be specific — use actual names from the schema.`,
};
