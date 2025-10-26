import type { RowDataPacket } from "mysql2/promise";

import { query } from "~/server/db";

export type SecurityEventRow = RowDataPacket & {
  id: number;
  ts_utc: Date;
  decision: string;
  suspicion_score: number;
  query_template: string | null;
};

export async function getRecentSecurityEvents(limit = 100): Promise<SecurityEventRow[]> {
  const sql = `
    SELECT id, ts_utc, decision, suspicion_score, query_template
    FROM Security_Event
    ORDER BY ts_utc DESC
    LIMIT ?
  `;
  const rows = await query<SecurityEventRow[]>(sql, [limit]);
  return rows;
}

export async function getFlaggedSecurityEvents(limit = 50): Promise<SecurityEventRow[]> {
  const sql = `
    SELECT id, ts_utc, decision, suspicion_score, query_template
    FROM Security_Event
    WHERE decision IN ('block', 'challenge')
    ORDER BY ts_utc DESC
    LIMIT ?
  `;
  const rows = await query<SecurityEventRow[]>(sql, [limit]);
  return rows;
}
