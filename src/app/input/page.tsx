"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { DataTable } from "~/components/data-table";

type DetectionResult = {
  decision?: string;
  score?: number;
  pattern?: string | null;
  engine?: string;
  lockoutApplied?: boolean;
  malicious?: boolean;
  error?: string;
};
type TableCell = string | number | null;
type TableRow = TableCell[];
type TableRecord = Record<string, TableCell>;
type ServerResult = { columns: string[]; rows: TableRecord[] };
type ServerResponse = { columns: string[]; rows: TableRow[] };
type MitigationResponse = {
  success?: boolean;
  malicious?: boolean;
  pattern?: string | null;
  lockout_applied?: boolean;
  error?: string;
};

type QueryPayload = {
  columns?: unknown;
  rows?: unknown;
  error?: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isTableCell(value: unknown): value is TableCell {
  return typeof value === "string" || typeof value === "number" || value === null;
}

function isTableRow(value: unknown): value is TableRow {
  return Array.isArray(value) && value.every(isTableCell);
}

function isTableRowArray(value: unknown): value is TableRow[] {
  return Array.isArray(value) && value.every(isTableRow);
}

function parseQueryPayload(value: unknown):
  | { success: true; columns: string[]; rows: TableRow[] }
  | { success: false; error?: string } {
  if (typeof value !== "object" || value === null) {
    return { success: false };
  }

  const payload = value as QueryPayload;
  const error = typeof payload.error === "string" ? payload.error : undefined;

  if (!isStringArray(payload.columns) || !isTableRowArray(payload.rows)) {
    return { success: false, error };
  }

  return {
    success: true,
    columns: payload.columns,
    rows: payload.rows,
  };
}

export default function InputPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DetectionResult>({});
  const [lastQuery, setLastQuery] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [serverRows, setServerRows] = useState<ServerResult | undefined>(undefined);
  const [serverError, setServerError] = useState<string | undefined>(undefined);
  const [infoMessage, setInfoMessage] = useState<string | undefined>(
    "Run a query to see output here.",
  );
  const [mitigationError, setMitigationError] = useState<string | undefined>(undefined);

  // Simple local detector to replace removed server/trpc
  function detectQuery(q: string): DetectionResult {
    const s = (q || "").toLowerCase();
    if (!s.trim()) return {};
    if (s.includes("drop") || s.includes("union") || s.includes("or 1=1") || s.includes("--")) {
      return { decision: "block", score: 90 };
    }
    if (s.includes("or") && s.includes("=")) return { decision: "challenge", score: 55 };
    return { decision: "allow", score: 0 };
  }

  async function executeQuery(sql: string): Promise<ServerResponse> {
    const response = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
      cache: "no-store",
    });

    let rawPayload: unknown;
    try {
      rawPayload = await response.json();
    } catch {
      rawPayload = null;
    }

    const parsed = parseQueryPayload(rawPayload);

    if (!response.ok) {
      const fallback = parsed.success === false ? parsed.error : undefined;
      throw new Error(fallback ?? "Failed to execute query");
    }

    if (parsed.success === false) {
      throw new Error(parsed.error ?? "Failed to execute query");
    }

    return { columns: parsed.columns, rows: parsed.rows };
  }

  async function logSecurityEvent(decision: string, score: number, queryText: string): Promise<void> {
    try {
      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, score, query: queryText }),
        cache: "no-store",
      });
    } catch (err) {
      console.error("Failed to log security event", err);
    }
  }

  async function fetchMitigation(sql: string): Promise<DetectionResult | null> {
    try {
      const response = await fetch("/api/mitigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql, applyLockout: false }),
        cache: "no-store",
      });

      const payload = (await response.json()) as MitigationResponse;

      if (!response.ok || !payload || payload.success === false) {
        const errorMessage = payload?.error ?? "Mitigation analysis failed.";
        throw new Error(errorMessage);
      }

      return {
        decision: payload.malicious ? "block" : "allow",
        score: payload.malicious ? 95 : 5,
        pattern: payload.pattern ?? null,
        engine: "Mitigation_SRC",
        lockoutApplied: payload.lockout_applied ?? false,
        malicious: payload.malicious ?? false,
      };
    } catch (err) {
      console.error("fetchMitigation failed", err);
      setMitigationError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }

  const runPipeline = async (sql: string) => {
    const trimmed = sql.trim();
    if (!trimmed) return;

    setRunning(true);
    setServerRows(undefined);
    setServerError(undefined);
    setInfoMessage(undefined);
    setMitigationError(undefined);

    try {
      let detection = { ...detectQuery(trimmed), engine: "Local heuristic" };
      setResult(detection);

      const mitigation = await fetchMitigation(trimmed);
      if (mitigation) {
        detection = mitigation;
        setResult(detection);
      }

      setLastQuery(trimmed);

      // Log the security event to the database
      await logSecurityEvent(
        detection.decision ?? "unknown",
        detection.score ?? 0,
        trimmed
      );

      const lower = trimmed.toLowerCase();
      const isSelect = lower.startsWith("select") && lower.includes(" from ");

      if (isSelect) {
        try {
          const data = await executeQuery(trimmed);
          const records = data.rows.map((row) => {
            const record: TableRecord = {};
            data.columns.forEach((col, index) => {
              record[col] = row[index] ?? null;
            });
            return record;
          });

          setServerRows({ columns: data.columns, rows: records });
          if (records.length === 0) {
            setInfoMessage("Query returned no rows.");
          }
        } catch (err) {
          console.error("executeQuery failed", err);
          setServerError(err instanceof Error ? err.message : String(err));
          setInfoMessage("Unable to retrieve live results.");
        }
      } else {
        setServerRows(undefined);
        setInfoMessage("Live previews are available for SELECT queries only.");
      }
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await runPipeline(query);
    setQuery("");
  };

  const runSample = async () => {
    const sample = "SELECT employee_id, first_name, last_name, email FROM employee_info LIMIT 10";
    await runPipeline(sample);
  };

  const tableColumns = useMemo<ColumnDef<TableRecord>[]>(() => {
    if (!serverRows) return [];

    return serverRows.columns.map((column) => ({
      accessorKey: column,
      header: ({ column: col }) => {
        const isSorted = col.getIsSorted();
        return (
          <Button
            variant="ghost"
            onClick={() => {
              if (isSorted === false) {
                col.toggleSorting(false); // Sort ascending
              } else if (isSorted === "asc") {
                col.toggleSorting(true); // Sort descending
              } else {
                col.clearSorting(); // Clear sorting
              }
            }}
            className="flex items-center gap-1 h-8 px-2"
          >
            {column}
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const value = row.getValue<TableCell>(column);
        return <span className="whitespace-nowrap">{value === null ? "" : String(value)}</span>;
      },
    }));
  }, [serverRows]);

  const tableData = serverRows?.rows ?? [];
  const tableEmptyMessage = infoMessage ?? (serverRows ? "No rows returned." : "Run a query to see output here.");

    return (
      <div className="space-y-10">
        <div className="rounded-[2.5rem] border border-white/40 p-8 shadow-lg backdrop-blur-2xl dark:border-white/10">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Simulator</p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">Input console</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Mirror the polish of an Apple lab: enter SQL statements, watch the detector respond in real time, and ship
            events into the telemetry log with a single tap.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/40 p-6 shadow-md backdrop-blur-xl dark:border-white/10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">SQL Input</label>
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-48 rounded-3xl border-white/30 bg-white/50 text-base shadow-inner shadow-white/20 placeholder:text-muted-foreground/60 dark:border-white/10 dark:bg-white/5"
                  placeholder="SELECT employee_id, email FROM employee_info WHERE ..."
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  disabled={running}
                  className="rounded-full bg-gradient-to-r from-primary via-sky-400 to-indigo-500 px-6"
                >
                  {running ? "Running..." : "Run query"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full border border-border px-5"
                  onClick={() => {
                    setQuery("");
                  }}
                >
                  Clear
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full px-5"
                  onClick={() => void runSample()}
                  disabled={running}
                >
                  Run sample
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-[2rem] border border-white/40 p-6 shadow-md backdrop-blur-xl dark:border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Query Output</p>
                <p className="text-xs text-muted-foreground">Live telemetry from SQLock DB</p>
              </div>
              <div className={`rounded-full px-4 py-1 text-xs font-semibold ${serverRows ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {serverRows ? "Live" : "Idle"}
              </div>
            </div>

            <div className="my-4 rounded-2xl border border-white/30 bg-white/40 p-4 text-sm text-foreground shadow-inner dark:bg-white/5">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Decision</span>
                <span className="rounded-full bg-primary/10 px-4 py-1 text-xs font-medium text-primary">
                  {result.decision ?? "Awaiting input"}
                </span>
                <span className="text-xs text-muted-foreground">Score: {result.score ?? "–"}</span>
                <span className="text-xs text-muted-foreground">Engine: {result.engine ?? "Local heuristic"}</span>
                {result.pattern && (
                  <span className="text-xs text-muted-foreground">Pattern: {result.pattern}</span>
                )}
                {result.lockoutApplied && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">Lockout queued</span>
                )}
                {lastQuery && (
                  <span className="truncate text-xs text-muted-foreground">{lastQuery}</span>
                )}
              </div>
            </div>

            {serverError && (
              <div className="mb-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                Server error: {serverError}
              </div>
            )}

            {mitigationError && (
              <div className="mb-3 rounded-2xl border border-amber-400/70 bg-amber-100/40 p-3 text-sm text-amber-900 dark:border-amber-200/30 dark:bg-amber-500/10 dark:text-amber-100">
                Mitigation warning: {mitigationError}
              </div>
            )}

            {(!serverRows || tableData.length === 0) && infoMessage && (
              <p className="text-sm text-muted-foreground">{infoMessage}</p>
            )}

            <div className="mt-4">
              <DataTable<TableRecord>
                columns={tableColumns}
                data={tableData}
                emptyMessage={tableEmptyMessage}
                className="rounded-[1.5rem] border border-white/20 bg-white/60 p-4 shadow-sm backdrop-blur-lg dark:bg-white/5"
              />
            </div>
          </div>
        </div>
      </div>
    );
}
