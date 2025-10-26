type LogRow = {
  id: number;
  ts_utc: string | Date;
  decision: string;
  suspicion_score: number;
  query_template?: string | null;
};

// When the real server/trpc is not present, show a small set of example flagged logs.
const mockFlagged: LogRow[] = [
  {
    id: 101,
    ts_utc: new Date().toISOString(),
    decision: "block",
    suspicion_score: 95,
    query_template: "DROP TABLE users; --",
  },
  {
    id: 102,
    ts_utc: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    decision: "challenge",
    suspicion_score: 60,
    query_template: "SELECT * FROM users WHERE username = 'a' OR 1=1 --';",
  },
];

export default function FlagsPage() {
  const logs: LogRow[] = mockFlagged;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Flagged Attempts</h1>
      <table className="table-auto w-full border text-sm">
        <thead>
          <tr className="bg-gray-700">
            <th>Timestamp</th>
            <th>Decision</th>
            <th>Score</th>
            <th>Query</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-t">
              <td>{new Date(l.ts_utc).toLocaleString()}</td>
              <td className={l.decision === "block" ? "text-red-600" : "text-yellow-600"}>
                {l.decision}
              </td>
              <td>{l.suspicion_score}</td>
              <td>{String(l.query_template ?? "")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
