import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { detectSQLi } from "~/utils/detector";

export const loggerRouter = createTRPCRouter({
  logQuery: publicProcedure
    .input(z.object({ query: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [decision, score] = detectSQLi(input.query);

      // Create a typed Prisma record in SecurityEvent (mapped to Security_Event table)
      // Use parameterized raw query to insert into Security_Event. This avoids relying
      // on generated Prisma model typings if Prisma client hasn't been generated yet.
      await ctx.db.$executeRaw`
        INSERT INTO Security_Event (ts_utc, decision, suspicion_score, query_template)
        VALUES (${new Date()}, ${decision}, ${score}, ${input.query})
      `;

      return { decision, score };
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    // Select all columns to avoid errors when the DB table uses different column names.
    const rawRows = await ctx.db.$queryRawUnsafe(`SELECT * FROM Security_Event ORDER BY ts_utc DESC LIMIT 50`);

    // Normalize rows to the shape the frontend expects. We tolerate different column names by checking several common variants.
    const mapped = (rawRows as Record<string, unknown>[]).map((r) => {
      const id = (r["id"] ?? r["ID"] ?? r["event_id"] ?? r["eventId"] ?? null) as unknown;
      const ts = (r["ts_utc"] ?? r["ts"] ?? r["timestamp"] ?? r["time"] ?? null) as unknown;
      const decision = String(r["decision"] ?? r["action"] ?? r["result"] ?? "unknown");
      const suspicion_score = Number(r["suspicion_score"] ?? r["score"] ?? r["suspicion"] ?? 0) || 0;
      const query_template = (r["query_template"] ?? r["query"] ?? r["sql"] ?? null) as unknown;
      return {
        id,
        ts_utc: ts,
        user_id: (r["user_id"] ?? r["user"] ?? null) as unknown,
        src_ip: (r["src_ip"] ?? r["srcIp"] ?? null) as unknown,
        query_template,
        decision,
        suspicion_score,
        rule_hits: (r["rule_hits"] ?? r["ruleHits"] ?? null) as unknown,
        endpoint: (r["endpoint"] ?? null) as unknown,
      };
    });

    return mapped;
  }),

  getFlagged: publicProcedure.query(async ({ ctx }) => {
    // Fetch raw rows and map the same way as getAll, then filter in JS to avoid relying on a specific column name for decision.
    const rawRows = await ctx.db.$queryRawUnsafe(`SELECT * FROM Security_Event ORDER BY ts_utc DESC LIMIT 200`);
    const mapped = (rawRows as Record<string, unknown>[]).map((r) => {
      const id = (r["id"] ?? r["ID"] ?? r["event_id"] ?? r["eventId"] ?? null) as unknown;
      const ts = (r["ts_utc"] ?? r["ts"] ?? r["timestamp"] ?? r["time"] ?? null) as unknown;
      const decision = String(r["decision"] ?? r["action"] ?? r["result"] ?? "unknown");
      const suspicion_score = Number(r["suspicion_score"] ?? r["score"] ?? r["suspicion"] ?? 0) || 0;
      const query_template = (r["query_template"] ?? r["query"] ?? r["sql"] ?? null) as unknown;
      return {
        id,
        ts_utc: ts,
        user_id: (r["user_id"] ?? r["user"] ?? null) as unknown,
        src_ip: (r["src_ip"] ?? r["srcIp"] ?? null) as unknown,
        query_template,
        decision,
        suspicion_score,
        rule_hits: (r["rule_hits"] ?? r["ruleHits"] ?? null) as unknown,
        endpoint: (r["endpoint"] ?? null) as unknown,
      };
    });

    const flagged = mapped.filter((m) => (m.decision ?? "").toString().toLowerCase() !== "allow");
    return flagged.slice(0, 50);
  }),
  runSelect: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Very conservative validation: allow only SELECT ... FROM ... queries
  // Trim and remove trailing semicolons to allow queries pasted with a terminal-style ';'
  let q = input.query.trim();
  q = q.replace(/;+\s*$/g, "");
  const lower = q.toLowerCase();

      // Reject if contains comment tokens or dangerous keywords
      const forbidden = ["--", "/*", "*/", "#", "drop ", "truncate ", ";", "insert ", "update ", "delete ", "alter ", "create "];
      for (const f of forbidden) if (lower.includes(f)) throw new Error("Query contains forbidden tokens");

      if (!lower.startsWith("select") || !lower.includes(" from ")) {
        throw new Error("Only simple SELECT queries are allowed in this demo");
      }

      // Limit query length
      if (q.length > 2000) throw new Error("Query too long");

      // Execute the raw query. Use $queryRawUnsafe because we are executing a raw string
  const rows = (await ctx.db.$queryRawUnsafe(q)) as Record<string, unknown>[];

      // Convert array of objects to { columns, rows } shape so the client can render a table.
      if (!rows || rows.length === 0) return { columns: [], rows: [] };

  const columns = Object.keys(rows[0] as Record<string, unknown>);
      const rowValues: (string | number | null)[][] = rows.map((r) =>
        columns.map((c) => {
          const v = r[c];
          if (v === null || v === undefined) return null;
          if (typeof v === "string" || typeof v === "number") return v;
          // Dates -> ISO, others -> stringify
          if (v instanceof Date) return v.toISOString();
          try {
            return String(v);
          } catch {
            return null;
          }
        })
      );

      return { columns, rows: rowValues };
    }),
});
