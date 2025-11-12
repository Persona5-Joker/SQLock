"use client";

import { useState } from "react";
import { DataTable } from "~/components/data-table";
import { securityEventColumns } from "~/components/security-event-columns";
import type { SecurityEventLog } from "~/types/security-event-log";
import { Button } from "~/components/ui/button";
import { RefreshCw, FileSearch } from "lucide-react";

interface LogsPageClientProps {
  initialRows: SecurityEventLog[];
  initialError: string | null;
}

export default function LogsPageClient({ initialRows, initialError }: LogsPageClientProps) {
  const [rows, setRows] = useState<SecurityEventLog[]>(initialRows);
  const [loadError, setLoadError] = useState<string | null>(initialError);
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

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(
          `✅ Analysis complete! Found ${data.incidents_found} suspicious entries, saved ${data.incidents_saved} to database.`
        );
        
        // Refresh the page data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setAnalysisResult(`❌ Analysis failed: ${data.error}`);
      }
    } catch (error) {
      setAnalysisResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">System Logs</h1>
        <Button
          onClick={handleAnalyzeLogs}
          disabled={isAnalyzing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileSearch className="h-4 w-4" />
              Analyze External Logs
            </>
          )}
        </Button>
      </div>

      {analysisResult && (
        <div className={`mb-4 p-3 rounded-md text-sm ${
          analysisResult.startsWith('✅') 
            ? 'bg-green-500/10 border border-green-500/50 text-green-700 dark:text-green-400' 
            : 'bg-destructive/10 border border-destructive/50 text-destructive'
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
        <div className="mt-3 text-sm text-destructive bg-destructive/10 border border-destructive/50 rounded-md p-3">
          {loadError}
        </div>
      )}
    </div>
  );
}
