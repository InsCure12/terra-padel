import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL ?? "./sqlite.db";

type DbClient = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __terraSqlite: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var __terraDb: DbClient | undefined;
}

const sqlite = global.__terraSqlite ?? new Database(databaseUrl);
export const db: DbClient = global.__terraDb ?? drizzle(sqlite, { schema });

if (process.env.NODE_ENV !== "production") {
  global.__terraSqlite = sqlite;
  global.__terraDb = db;
}

export { sqlite };
