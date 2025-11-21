import { createPool, type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

import { env } from "~/env";

const pool: Pool = createPool({
  uri: env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

type QueryParams = ReadonlyArray<unknown>;

export async function query<T extends RowDataPacket[] | ResultSetHeader>(
  sql: string,
  params: QueryParams = [],
): Promise<T> {
  const [rows] = await pool.query<T>(sql, params);
  return rows;
}


