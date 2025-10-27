import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";

import { query } from "~/server/db";

export const dynamic = "force-dynamic";

type VerificationPayload = {
  employeeId?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as VerificationPayload;
    
    // Get values, defaulting to empty string if not provided
    const employeeId = raw.employeeId?.toString() ?? "";
    const email = raw.email ?? "";
    const password = raw.password ?? "";

    // Intentionally insecure: user-supplied values are interpolated directly into SQL.
    // This endpoint exists to demonstrate SQL injection risk within the demo environment.
    // In a password reset flow, the application retrieves user information to verify identity.
    const sql = `
      SELECT employee_id, first_name, last_name, email, SSN, Salary, bank_routing_number, Address
      FROM employee_info
      WHERE employee_id = ${employeeId}
        AND email = '${email}'
        AND password = '${password}';
    `;

    const result = await query<RowDataPacket[]>(sql);
    const matchFound = Array.isArray(result) && result.length > 0;

    if (matchFound) {
      return NextResponse.json(
        {
          status: "verified",
          message: "Identity verified successfully. Your account information has been retrieved.",
          data: result, // VULNERABILITY: Exposing all query results including sensitive data
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        status: "not_found",
        message: "No employee found with the provided credentials. Please check your Employee ID and email address.",
        data: result, // VULNERABILITY: Even showing empty results can leak info
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Identity verification failed", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      {
        status: "error",
        message: `Verification failed: ${message}`,
      },
      { status: 500 },
    );
  }
}
