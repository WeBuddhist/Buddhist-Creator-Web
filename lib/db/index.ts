import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/* One pool per process, kept on globalThis so `next dev`'s module reloads
   do not open a new one each time. Render's Postgres needs TLS from outside
   its network and presents a certificate the Node trust store does not
   know, hence rejectUnauthorized: false. Set DATABASE_SSL=false for a local
   Postgres. */

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const ssl =
    process.env.DATABASE_SSL === "false" || /localhost|127\.0\.0\.1/.test(connectionString)
      ? undefined
      : { rejectUnauthorized: false };
  return new Pool({ connectionString, ssl, max: 5 });
}

const globalForDb = globalThis as unknown as { __pool?: Pool };

function getPool() {
  globalForDb.__pool ??= createPool();
  return globalForDb.__pool;
}

let instance: ReturnType<typeof create> | undefined;

function create() {
  return drizzle({ client: getPool(), schema });
}

/** The Drizzle client. Built on first use, so importing this module never
    needs the database variable to be set. */
export function db() {
  instance ??= create();
  return instance;
}

export { schema };
