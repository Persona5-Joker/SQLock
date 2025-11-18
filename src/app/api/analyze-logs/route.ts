import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

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
    
    // Path to Python executable in virtual environment
    const pythonExe = path.join(process.cwd(), "venv", "Scripts", "python.exe");

    // Execute the Python script with --from-db flag to read from database
    const command = `"${pythonExe}" "${pythonScriptPath}" --from-db`;
    
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
