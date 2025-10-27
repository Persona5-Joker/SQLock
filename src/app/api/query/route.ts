import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";

import { query } from "~/server/db";

export const dynamic = "force-dynamic";

type QueryRequestBody = {
  query?: unknown;
};

function extractSql(body: unknown): string {
  if (typeof body !== "object" || body === null) return "";
  const { query } = body as QueryRequestBody;
  return typeof query === "string" ? query.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const sql = extractSql(body);

    if (!sql) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    const normalized = sql.toLowerCase();
    if (!normalized.startsWith("select")) {
      return NextResponse.json(
        { error: "Only SELECT queries are permitted." },
        { status: 400 },
      );
    }

    if (!normalized.includes("from employee_info")) {
      return NextResponse.json(
        { error: "Queries are limited to the employee_info table." },
        { status: 400 },
      );
    }

  const rows = await query<RowDataPacket[]>(sql);
  const firstRow = rows[0] as RowDataPacket | undefined;
  const columns = firstRow ? Object.keys(firstRow as Record<string, unknown>) : [];
    const tableRows = rows.map((row) => {
      const record = row as Record<string, unknown>;
      return columns.map((col) => (record[col] ?? null));
    });

    return NextResponse.json({ columns, rows: tableRows });
  } catch (error: unknown) {
    console.error("Failed to execute query", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
