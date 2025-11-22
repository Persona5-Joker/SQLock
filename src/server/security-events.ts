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
    FROM Logs
    ORDER BY ts_utc DESC
    LIMIT ?
  `;
  const rows = await query<SecurityEventRow[]>(sql, [limit]);
  return rows;
}

export async function getFlaggedSecurityEvents(limit = 50): Promise<SecurityEventRow[]> {
  const sql = `
    SELECT id, ts_utc, decision, suspicion_score, query_template
    FROM Logs
    WHERE decision IN ('block', 'challenge', 'honeypot')
    ORDER BY ts_utc DESC
    LIMIT ?
  `;
  const rows = await query<SecurityEventRow[]>(sql, [limit]);
  return rows;
}

export async function logSecurityEvent(
  decision: string,
  suspicionScore: number,
  queryTemplate: string,
): Promise<void> {
  const sql = `
    INSERT INTO Logs (decision, suspicion_score, query_template)
    VALUES (?, ?, ?)
  `;
  await query(sql, [decision, suspicionScore, queryTemplate]);
}
