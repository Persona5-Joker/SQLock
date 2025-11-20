import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

type PythonAnalyzeResult = {
  success: boolean;
  incidents_found: number;
  incidents_saved: number;
  raw_output?: string;
};

function isPythonAnalyzeResult(value: unknown): value is PythonAnalyzeResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.success === "boolean" &&
    typeof candidate.incidents_found === "number" &&
    typeof candidate.incidents_saved === "number"
  );
}

export async function POST(_request: Request) {
  try {
    // Path to the Python script
    const pythonScriptPath = path.join(process.cwd(), "sqlock", "tools", "SQLlog.py");
    
    // Try several possible python executable locations and fall back to 'python' on PATH
    const pythonCandidates = [
      path.join(process.cwd(), ".venv", "Scripts", "python.exe"), // common Windows venv used here
      path.join(process.cwd(), ".venv", "bin", "python"), // unix-style
      path.join(process.cwd(), "venv", "Scripts", "python.exe"),
      path.join(process.cwd(), "venv", "bin", "python"),
      "python",
    ];

    let chosenPython: string | null = null;
    for (const candidate of pythonCandidates) {
      // If candidate is an absolute path, check file exists; otherwise assume it's on PATH
      if (candidate === "python") {
        chosenPython = candidate;
        break;
      }
      try {
        if (fs.existsSync(candidate)) {
          chosenPython = candidate;
          break;
        }
      } catch (e) {
        // ignore
      }
    }

    if (!chosenPython) {
      throw new Error(`No Python executable found. Tried: ${pythonCandidates.join(", ")}`);
    }

    // Execute the Python script with --from-db flag to read from database
    const command = `"${chosenPython}" "${pythonScriptPath}" --from-db`;
    
    console.log(`Executing: ${command}`);
    
    const { stdout, stderr } = (await execAsync(command, {
      timeout: 30000, // 30 second timeout
    })) as { stdout: string | Buffer; stderr: string | Buffer };

    const stdoutText: string = typeof stdout === "string" ? stdout : stdout.toString("utf8");
    const stderrText: string = typeof stderr === "string" ? stderr : stderr.toString("utf8");

    // Try to parse JSON output from the script
    let result: PythonAnalyzeResult = {
      success: true,
      incidents_found: 0,
      incidents_saved: 0,
    };
    try {
      // The script outputs JSON on the last line
      const lines = stdoutText.trim().split("\n");
      const jsonLine = lines[lines.length - 1];
      if (jsonLine) {
        const parsed = JSON.parse(jsonLine) as unknown;
        if (isPythonAnalyzeResult(parsed)) {
          result = parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse Python output:", e);
      result = {
        success: true,
        incidents_found: 0,
        incidents_saved: 0,
        raw_output: stdoutText,
      };
    }

    const safeErrors = stderrText.trim().length > 0 ? stderrText : null;

    return NextResponse.json({
      ...result,
      logs: stdoutText,
      errors: safeErrors,
    });
  } catch (error) {
    console.error("Error analyzing logs:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
