"use client";

import { useMemo, useState } from "react";

type LogRow = {
  id: number;
  ts_utc: string | Date;
  decision: string;
  suspicion_score: number;
  query_template?: string | null;
};

const mockData: LogRow[] = [
  {
    id: 1,
    ts_utc: new Date().toISOString(),
    decision: "allow",
    suspicion_score: 0,
    query_template: "SELECT * FROM Employee_Info WHERE employee_id = 1;",
  },
  {
    id: 2,
    ts_utc: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    decision: "challenge",
    suspicion_score: 50,
    query_template: "SELECT * FROM users WHERE username = 'a' OR 1=1 --';",
  },
  {
    id: 3,
    ts_utc: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    decision: "block",
    suspicion_score: 75,
    query_template: "UNION SELECT password FROM users;",
  },
];

export default function LogsPage() {
  const [data, setData] = useState<LogRow[] | undefined>(mockData);
  const [isLoading, setIsLoading] = useState(false);

  // refetch will just re-load the mock data for now
  const refetch = async () => {
    setIsLoading(true);
    // simulate small delay
    await new Promise((r) => setTimeout(r, 200));
    setData(mockData);
    setIsLoading(false);
  };

  const rows: LogRow[] = useMemo(() => (data ?? mockData), [data]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">System Logs</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refetch()}
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 bg-white rounded border">Loading logs...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded border">
          <table className="table-auto w-full text-sm">
            <thead>
              <tr className="bg-gray-500 text-left">
                <th className="px-4 py-2">Time (UTC)</th>
                <th className="px-4 py-2">Decision</th>
                <th className="px-4 py-2">Score</th>
                <th className="px-4 py-2">Query</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-t hover:bg-gray-600">
                  <td className="px-4 py-2 align-top">
                    {new Date(l.ts_utc).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 align-top">
                    <span
                      className={`font-medium ${
                        l.decision === "block"
                          ? "text-red-600"
                          : l.decision === "challenge"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {l.decision}
                    </span>
                  </td>
                  <td className="px-4 py-2 align-top">{l.suspicion_score}</td>
                  <td className="px-4 py-2 align-top">
                    <div className="truncate max-w-xl">{String(l.query_template ?? "")}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
