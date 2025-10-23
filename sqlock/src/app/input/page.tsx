"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";

type DetectionResult = { decision?: string; score?: number };

function simulateDbResponse(query: string) {
  const q = (query || "").toLowerCase();
  if (!q.trim()) return { type: "empty" as const };

  // Very simple heuristics for simulation
  if (q.startsWith("select") || q.includes("from")) {
    // return a few mock rows
    return {
      type: "rows" as const,
      columns: ["employee_id", "first_name", "last_name", "email"],
      rows: [
        [1, "Satyam", "Garg", "satyam@example.com"],
        [2, "Danielle", "Bryan", "danielle@example.com"],
      ],
    };
  }

  if (q.startsWith("insert") || q.startsWith("update") || q.startsWith("delete")) {
    return { type: "ok" as const, message: "Query executed. 1 row affected." };
  }

  // default fallback
  return { type: "ok" as const, message: "Query executed." };
}

export default function InputPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DetectionResult>({});
  const [lastQuery, setLastQuery] = useState<string>("");
  const [running, setRunning] = useState(false);

  const mutation = api.logger.logQuery.useMutation();
  const runSelect = api.logger.runSelect.useMutation();

  const output = useMemo(() => simulateDbResponse(lastQuery), [lastQuery]);

  type Row = (string | number | null)[];
  type ServerResult = { columns: string[]; rows: Row[] };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setRunning(true);
    try {
      const res = await mutation.mutateAsync({ query });
      setResult(res);
      setLastQuery(query);
      // if select, try running it against DB
      const lower = query.trim().toLowerCase();
      if (lower.startsWith("select") && lower.includes(" from ")) {
        try {
          const res = await runSelect.mutateAsync({ query });
          // server returns { columns, rows }
          setServerRows(res as ServerResult);
        } catch (err) {
          console.error("runSelect failed", err);
          if (err instanceof Error) setServerError(err.message);
          else setServerError(String(err));
        }
      } else {
        setServerRows(undefined);
        setServerError(undefined);
      }

      setQuery("");
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const [serverRows, setServerRows] = useState<ServerResult | undefined>(undefined);
  const [serverError, setServerError] = useState<string | undefined>(undefined);

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
                onClick={async () => {
                  // Run a safe sample SELECT against the real table
                  const sample = "SELECT employee_id, first_name, last_name, email FROM employee_info LIMIT 10";
                  setRunning(true);
                  try {
                    const res = await mutation.mutateAsync({ query: sample });
                    setResult(res);
                    setLastQuery(sample);
                    try {
                const res = await runSelect.mutateAsync({ query: sample });
                setServerRows(res as ServerResult);
                      setServerError(undefined);
                    } catch (err) {
                      console.error("runSelect failed", err);
                      if (err instanceof Error) setServerError(err.message);
                      else setServerError(String(err));
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setRunning(false);
                  }
                }}
                className="px-3 py-2 rounded border bg-gray-100 hover:bg-gray-200"
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
              <div className="font-semibold">{serverRows ? "Live DB Results" : "Simulated DB Output"}</div>
              {serverRows ? (
                <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">Live</div>
              ) : (
                <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">Simulated</div>
              )}
            </div>

            {!lastQuery && <div className="text-sm text-gray-500">Run a query to see simulated output here.</div>}

            {lastQuery && output.type === "empty" && (
              <div className="text-sm text-gray-500">No query entered.</div>
            )}

            {lastQuery && output.type === "ok" && (
              <div className="text-sm text-gray-700">{output.message}</div>
            )}

            {serverError && (
              <div className="mt-2 p-2 border rounded bg-red-50 text-red-700 text-sm">Server error: {serverError}</div>
            )}

            {lastQuery && output.type === "rows" && (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      {(serverRows ? serverRows.columns : output.columns).map((c: string) => (
                        <th key={c} className="px-2 py-1 text-left">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(serverRows ? serverRows.rows : (output.rows as Row[])).map((r: Row, i: number) => (
                      <tr key={i} className="border-t">
                        {r.map((v: string | number | null, j: number) => (
                          <td key={j} className="px-2 py-1 align-top">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
