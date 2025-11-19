import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { existsSync } from "fs";

const execFileAsync = promisify(execFile);

 type MitigationRequestBody = {
  query?: unknown;
  username?: unknown;
  applyLockout?: unknown;
};

 function extractPayload(body: unknown): { query: string; username?: string; applyLockout: boolean } | null {
  if (typeof body !== "object" || body === null) return null;
  const { query, username, applyLockout } = body as MitigationRequestBody;
  if (typeof query !== "string" || !query.trim()) {
    return null;
  }
  const normalizedUsername =
    typeof username === "string" ? username.trim() || undefined : undefined;

  return {
    query: query.trim(),
    username: normalizedUsername,
    applyLockout: Boolean(applyLockout),
  };
}

 type MitigationCliResult = {
  success?: boolean;
  malicious?: boolean;
  pattern?: string | null;
  lockout_applied?: boolean;
};

 function resolvePythonExecutable(): string {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "venv", "Scripts", "python.exe"),
    path.join(cwd, ".venv", "Scripts", "python.exe"),
    "python",
    "python3",
  ];
  for (const candidate of candidates) {
    if (candidate.endsWith("python") || candidate.endsWith("python3")) {
      return candidate;
    }
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return "python";
}

 export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const payload = extractPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Query text is required." }, { status: 400 });
    }

    const pythonExe = resolvePythonExecutable();
    const mitigationScript = path.join(process.cwd(), "Mitigation_SRC.py");
    const args = [mitigationScript, "--query", payload.query];

    if (payload.username) {
      args.push("--username", payload.username);
    }

    if (payload.applyLockout) {
      args.push("--apply-lockout");
    }

    const { stdout, stderr } = await execFileAsync(pythonExe, args, {
      timeout: 15000,
      windowsHide: true,
    });

    const stdoutText = stdout?.toString()?.trim() ?? "";
    const stderrText = stderr?.toString()?.trim() ?? "";

    let cliResult: MitigationCliResult = {};
    if (stdoutText) {
      const lastLine = stdoutText.split("\n").pop();
      if (lastLine) {
        try {
          cliResult = JSON.parse(lastLine) as MitigationCliResult;
        } catch (parseError) {
          console.error("Failed to parse mitigation output", parseError, stdoutText);
        }
      }
    }

    if (typeof cliResult.malicious === "undefined") {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to parse mitigation results.",
          stdout: stdoutText,
          stderr: stderrText || null,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      malicious: cliResult.malicious ?? false,
      pattern: cliResult.pattern ?? null,
      lockout_applied: cliResult.lockout_applied ?? false,
      stderr: stderrText || null,
    });
  } catch (error) {
    console.error("Mitigation execution failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
 }
