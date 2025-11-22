import { createPool, type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

import { env } from "~/env";

const pool: Pool = createPool({
  uri: env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Enable multi-statement execution so SQL injection simulations (e.g. stacked UPDATEs)
  // actually reach the database when mitigation is disabled.
  multipleStatements: true,
});

type QueryParams = ReadonlyArray<unknown>;

import { executeCsvQuery } from "./csv-adapter";

let useCsv = false;

export const getUseCsv = () => useCsv;


export async function query<T extends RowDataPacket[] | ResultSetHeader>(
  sql: string,
  params: QueryParams = [],
): Promise<T> {
  if (useCsv) {
    return (await executeCsvQuery(sql, params as unknown[])) as T;
  }

  try {
    const [rows] = await pool.query(sql, params);

    // When multipleStatements is enabled, mysql2 returns an array where each entry
    // corresponds to a statement. We only need the first SELECT result set for
    // preview purposes, but still want later statements (e.g. injected UPDATEs)
    // to execute as side effects. If the driver returned nested arrays, unwrap
    // the first one so callers keep working with a flat RowDataPacket[].
    if (Array.isArray(rows) && rows.length > 0 && Array.isArray(rows[0])) {
      return rows[0] as T;
    }

    return rows as T;
  } catch (error: unknown) {
    const err = error as { code?: string };
    // Check for common connection errors
    if (
      err.code === "ECONNREFUSED" ||
      err.code === "PROTOCOL_CONNECTION_LOST" ||
      err.code === "ETIMEDOUT" ||
      err.code === "ENOTFOUND"
    ) {
      console.warn(
        `Database connection failed (${err.code}), switching to CSV backup.`,
      );
      useCsv = true;
      return (await executeCsvQuery(sql, params as unknown[])) as T;
    }
    throw error;
  }
}


