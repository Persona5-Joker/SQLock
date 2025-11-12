import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    // Path to the Python script
    const pythonScriptPath = path.join(process.cwd(), "sqlock", "tools", "SQLlog.py");
    
    // Path to Python executable in virtual environment
    const pythonExe = path.join(process.cwd(), ".venv", "Scripts", "python.exe");

    // Execute the Python script with --from-db flag to read from database
    const command = `"${pythonExe}" "${pythonScriptPath}" --from-db`;
    
    console.log(`Executing: ${command}`);
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 second timeout
    });

    // Try to parse JSON output from the script
    let result;
    try {
      // The script outputs JSON on the last line
      const lines = stdout.trim().split('\n');
      const jsonLine = lines[lines.length - 1];
      if (jsonLine) {
        result = JSON.parse(jsonLine);
      } else {
        result = {
          success: true,
          incidents_found: 0,
          incidents_saved: 0,
        };
      }
    } catch (e) {
      console.error("Failed to parse Python output:", e);
      result = {
        success: true,
        incidents_found: 0,
        incidents_saved: 0,
        raw_output: stdout,
      };
    }

    return NextResponse.json({
      success: true,
      ...result,
      logs: stdout,
      errors: stderr || null,
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
