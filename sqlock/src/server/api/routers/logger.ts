import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { detectSQLi } from "~/utils/detector";

export const loggerRouter = createTRPCRouter({
  logQuery: publicProcedure
    .input(z.object({ query: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [decision, score] = detectSQLi(input.query);

      // Use parameterized raw query to insert into Security_Event. This avoids relying
      // on generated Prisma model typings if Prisma client hasn't been generated yet.
      await ctx.db.$executeRaw`
        INSERT INTO Security_Event (ts_utc, decision, suspicion_score, query_template)
        VALUES (${new Date()}, ${decision}, ${score}, ${input.query})
      `;

      return { decision, score };
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    type SecurityEvent = {
      id: number;
      ts_utc: Date | string;
      user_id?: string | null;
      src_ip?: string | null;
      query_template?: string | null;
      decision: string;
      suspicion_score: number;
      rule_hits?: string | null;
      endpoint?: string | null;
    };

    const rows = await ctx.db.$queryRaw<SecurityEvent[]>`
      SELECT id, ts_utc, user_id, src_ip, query_template, decision, suspicion_score, rule_hits, endpoint
      FROM Security_Event
      ORDER BY ts_utc DESC
      LIMIT 50
    `;
    return rows;
  }),

  getFlagged: publicProcedure.query(async ({ ctx }) => {
    type SecurityEvent = {
      id: number;
      ts_utc: Date | string;
      user_id?: string | null;
      src_ip?: string | null;
      query_template?: string | null;
      decision: string;
      suspicion_score: number;
      rule_hits?: string | null;
      endpoint?: string | null;
    };

    const rows = await ctx.db.$queryRaw<SecurityEvent[]>`
      SELECT id, ts_utc, user_id, src_ip, query_template, decision, suspicion_score, rule_hits, endpoint
      FROM Security_Event
      WHERE decision <> 'allow'
      ORDER BY ts_utc DESC
      LIMIT 50
    `;
    return rows;
  }),
});
