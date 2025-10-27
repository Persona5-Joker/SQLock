import { NextResponse } from "next/server";

import { logSecurityEvent } from "~/server/security-events";

export const dynamic = "force-dynamic";

type LogRequestBody = {
  decision?: unknown;
  score?: unknown;
  query?: unknown;
};

function extractLogData(body: unknown): { decision: string; score: number; query: string } | null {
  if (typeof body !== "object" || body === null) return null;
  
  const { decision, score, query } = body as LogRequestBody;
  
  if (typeof decision !== "string" || typeof score !== "number" || typeof query !== "string") {
    return null;
  }
  
  return { decision, score, query };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const logData = extractLogData(body);

    if (!logData) {
      return NextResponse.json(
        { error: "Invalid log data. Required: decision (string), score (number), query (string)" },
        { status: 400 }
      );
    }

    await logSecurityEvent(logData.decision, logData.score, logData.query);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to log security event", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
