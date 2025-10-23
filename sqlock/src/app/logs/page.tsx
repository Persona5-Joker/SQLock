import { api } from "~/trpc/server";

type LogRow = {
  id: number;
  ts_utc: string | Date;
  decision: string;
  suspicion_score: number;
  query_template?: string | null;
};

export default async function LogsPage() {
  const logs = (await api.logger.getAll()) as LogRow[];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">System Logs</h1>
      <table className="table-auto w-full border text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-2">Time (UTC)</th>
            <th className="px-2">Decision</th>
            <th className="px-2">Score</th>
            <th className="px-2">Query</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-t">
              <td className="px-2">{new Date(l.ts_utc).toLocaleString()}</td>
              <td className="px-2">{l.decision}</td>
              <td className="px-2">{l.suspicion_score}</td>
              <td className="px-2">{String(l.query_template ?? "")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
