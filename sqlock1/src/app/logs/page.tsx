import { DataTable } from "~/components/data-table";
import { securityEventColumns } from "~/components/security-event-columns";
import { getRecentSecurityEvents, type SecurityEventRow } from "~/server/security-events";
import type { SecurityEventLog } from "~/types/security-event-log";

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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">System Logs</h1>
      </div>

      <DataTable
        columns={securityEventColumns}
        data={rows}
        emptyMessage="No log entries found."
      />

      {loadError && <div className="mt-3 text-sm text-destructive bg-destructive/10 border border-destructive/50 rounded-md p-3">{loadError}</div>}
    </div>
  );
}
