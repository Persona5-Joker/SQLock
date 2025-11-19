"use client";

import { useState } from "react";
import { DataTable } from "~/components/data-table";
import { securityEventColumns } from "~/components/security-event-columns";
import type { SecurityEventLog } from "~/types/security-event-log";
import { Button } from "~/components/ui/button";
import { RefreshCw, FileSearch } from "lucide-react";

type AnalyzeResponse = {
  success: boolean;
  incidents_found: number;
  incidents_saved: number;
  error?: string;
};

interface LogsPageClientProps {
  initialRows: SecurityEventLog[];
  initialError: string | null;
}

export default function LogsPageClient({ initialRows, initialError }: LogsPageClientProps) {
  const [rows] = useState<SecurityEventLog[]>(initialRows);
  const [loadError] = useState<string | null>(initialError);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  async function handleAnalyzeLogs() {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const response = await fetch('/api/analyze-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = (await response.json()) as AnalyzeResponse;

      if (data.success) {
        setAnalysisResult(
          `✅ Analysis complete! Found ${data.incidents_found} suspicious entries, saved ${data.incidents_saved} to database.`
        );
        
        // Refresh the page data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const errorMessage = data.error ?? 'Analysis failed without additional context.';
        setAnalysisResult(`❌ Analysis failed: ${errorMessage}`);
      }
    } catch (error) {
      setAnalysisResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2.5rem] border border-white/30 p-6 shadow-lg backdrop-blur-2xl dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Logs</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">System intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Live Security_Event records, rendered with pill filters and clean typography for at-a-glance context.
          </p>
        </div>
        <Button
          onClick={handleAnalyzeLogs}
          disabled={isAnalyzing}
          variant="ghost"
          className="flex items-center gap-2 rounded-full border border-white/30 px-5 py-2"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileSearch className="h-4 w-4" />
              Analyze external logs
            </>
          )}
        </Button>
      </div>

      {analysisResult && (
        <div className={`rounded-[1.5rem] border px-4 py-3 text-sm ${
          analysisResult.startsWith('✅')
            ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-600'
            : 'border-destructive/50 bg-destructive/10 text-destructive'
        }`}>
          {analysisResult}
        </div>
      )}

      <DataTable
        columns={securityEventColumns}
        data={rows}
        emptyMessage="No log entries found."
      />

      {loadError && (
        <div className="rounded-[1.5rem] border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}
    </div>
  );
}
