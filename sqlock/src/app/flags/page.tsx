import { api } from "~/trpc/server";

type LogRow = {
  id: number;
  ts_utc: string | Date;
  decision: string;
  suspicion_score: number;
  query_template?: string | null;
};

export default async function FlagsPage() {
  const logs = (await api.logger.getFlagged()) as LogRow[];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Flagged Attempts</h1>
      <table className="table-auto w-full border text-sm">
        <thead>
          <tr className="bg-gray-200">
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
