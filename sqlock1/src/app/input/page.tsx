"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/data-table";

type DetectionResult = { decision?: string; score?: number };
type TableCell = string | number | null;
type TableRow = TableCell[];
type TableRecord = Record<string, TableCell>;
type ServerResult = { columns: string[]; rows: TableRecord[] };
type ServerResponse = { columns: string[]; rows: TableRow[] };

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

  const runPipeline = async (sql: string) => {
    const trimmed = sql.trim();
    if (!trimmed) return;

    setRunning(true);
    setServerRows(undefined);
    setServerError(undefined);
    setInfoMessage(undefined);

    try {
      const detection = detectQuery(trimmed);
      setResult(detection);
      setLastQuery(trimmed);

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
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">SQLock – Input Simulation</h1>

      <div className="space-y-6">
        <div>
          <form onSubmit={handleSubmit}>
            <label className="block mb-2 font-medium">SQL Input</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border rounded p-2 mb-2 h-40"
              placeholder="Enter SQL command"
            />

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={running}
                className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-60"
              >
                {running ? "Running..." : "Run"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuery("");
                }}
                className="px-3 py-2 rounded border"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => void runSample()}
                disabled={running}
                className="px-3 py-2 rounded border bg-gray-500 hover:bg-gray-200 disabled:opacity-60"
              >
                Run sample
              </button>
            </div>

            {/* Decision display intentionally removed to keep the input UI compact */}
          </form>
        </div>

        <div>
          <div className="p-4 border rounded bg-white min-h-[200px]">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Query Output</div>
              {serverRows ? (
                <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">Live</div>
              ) : (
                <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">Idle</div>
              )}
            </div>

            {/* show detection result */}
            <div className="mb-3">
              <div className="text-sm">Detector decision: <span className="font-medium">{result.decision ?? "-"}</span></div>
              <div className="text-xs text-gray-500">Score: {result.score ?? "-"}</div>
            </div>

            {!lastQuery && infoMessage && (
              <div className="text-sm text-gray-500">{infoMessage}</div>
            )}

            {serverError && (
              <div className="mt-2 p-2 border rounded bg-red-50 text-red-700 text-sm">Server error: {serverError}</div>
            )}

            {lastQuery && infoMessage && !serverRows && (
              <div className="text-sm text-gray-700">{infoMessage}</div>
            )}

            <div className="mt-2">
              <DataTable<TableRecord>
                columns={tableColumns}
                data={tableData}
                emptyMessage={tableEmptyMessage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
