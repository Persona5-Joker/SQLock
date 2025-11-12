import { getRecentSecurityEvents, type SecurityEventRow } from "~/server/security-events";
import type { SecurityEventLog } from "~/types/security-event-log";
import LogsPageClient from "./_components/logs-page-client";

function formatRows(rows: readonly SecurityEventRow[]): SecurityEventLog[] {
  return rows.map((row) => ({
    id: row.id,
    ts_utc: row.ts_utc instanceof Date ? row.ts_utc : new Date(row.ts_utc),
    decision: row.decision,
    suspicion_score: row.suspicion_score,
    query_template: row.query_template ?? null,
  }));
}

export default async function LogsPage() {
  let rows: SecurityEventLog[] = [];
  let loadError: string | null = null;

  try {
    rows = formatRows(await getRecentSecurityEvents(200));
  } catch (error) {
    console.error("Failed to fetch logs", error);
    loadError = "Unable to reach the database. No log entries available.";
  }

  return <LogsPageClient initialRows={rows} initialError={loadError} />;
}

