"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function InputPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ decision?: string; score?: number }>(
    {}
  );
  const mutation = api.logger.logQuery.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await mutation.mutateAsync({ query });
      setResult(res);
      setQuery("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">SQLock – Input Simulation</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border rounded p-2 mb-2"
          placeholder="Enter SQL command"
          rows={6}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2"
        >
          Submit
        </button>
      </form>

      {result.decision && (
        <div className="mt-4 p-3 border rounded">
          <p className="font-semibold">Decision: {result.decision}</p>
          <p>Suspicion Score: {result.score}</p>
        </div>
      )}
    </div>
  );
}
