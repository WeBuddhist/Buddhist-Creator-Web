// Applies the SQL in drizzle/ to DATABASE_URL. Used by `npm run db:migrate`
// locally (reads .env.local when present) and on Render (reads the service's
// environment). Goes through Drizzle's migrator rather than drizzle-kit so
// the TLS rule matches lib/db/index.ts: TLS on unless the host is local or
// DATABASE_SSL=false.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const ssl =
  process.env.DATABASE_SSL === "false" || /localhost|127\.0\.0\.1/.test(connectionString)
    ? undefined
    : { rejectUnauthorized: false };

const pool = new Pool({ connectionString, ssl, max: 1 });
try {
  await migrate(drizzle({ client: pool }), { migrationsFolder: "./drizzle" });
  const { rows } = await pool.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by 1",
  );
  console.log("Migrations applied. Tables:", rows.map((r) => r.table_name).join(", "));
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
