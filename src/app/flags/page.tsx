import { DataTable } from "~/components/data-table";
import { securityEventColumns } from "~/components/security-event-columns";
import { getFlaggedSecurityEvents, type SecurityEventRow } from "~/server/security-events";
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

export default async function FlagsPage() {
  let logs: SecurityEventLog[] = [];
  try {
    logs = formatRows(await getFlaggedSecurityEvents(100));
  } catch (err) {
    console.error("Failed to fetch flagged events", err);
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-destructive">Flagged Attempts</h1>
      <DataTable
        columns={securityEventColumns}
        data={logs}
        emptyMessage="No flagged attempts found."
      />
    </div>
  );
}
