import fs from "node:fs";
import path from "node:path";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";
import { SCHEMA_SQL } from "./sql";
import { seedIfEmpty } from "./seed";

type AppDb =
  | ReturnType<typeof drizzlePglite<typeof schema>>
  | ReturnType<typeof drizzlePg<typeof schema>>;

const globalForDb = globalThis as unknown as {
  sarafaDb?: AppDb;
  sarafaReady?: Promise<AppDb>;
};

async function createDb(): Promise<AppDb> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const sql = postgres(url, { max: 4 });
    const db = drizzlePg(sql, { schema });
    for (const stmt of SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean)) {
      await sql.unsafe(stmt);
    }
    await seedIfEmpty(db);
    return db;
  }

  const dataDir = path.join(process.cwd(), "data", "pglite");
  fs.mkdirSync(dataDir, { recursive: true });
  const pg = new PGlite(dataDir);
  await pg.waitReady;
  const db = drizzlePglite(pg, { schema });
  await pg.exec(SCHEMA_SQL);
  await seedIfEmpty(db);
  return db;
}

export async function getDb(): Promise<AppDb> {
  if (globalForDb.sarafaDb) return globalForDb.sarafaDb;
  if (!globalForDb.sarafaReady) {
    globalForDb.sarafaReady = createDb()
      .then((db) => {
        globalForDb.sarafaDb = db;
        return db;
      })
      .catch((err) => {
        globalForDb.sarafaReady = undefined;
        throw err;
      });
  }
  return globalForDb.sarafaReady;
}

export type Database = AppDb;
