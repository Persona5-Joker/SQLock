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
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-white/30 p-6 shadow-lg backdrop-blur-2xl dark:border-white/10">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Alerts</p>
        <h1 className="mt-2 text-3xl font-semibold text-destructive">Flagged attempts</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every block-level event is elevated with neon pills and timestamp context so you can triage at a glance.
        </p>
      </div>
      <DataTable
        columns={securityEventColumns}
        data={logs}
        emptyMessage="No flagged attempts found."
      />
    </div>
  );
}
