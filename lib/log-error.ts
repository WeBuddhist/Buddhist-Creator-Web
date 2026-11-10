import { DrizzleQueryError } from "drizzle-orm/errors";
import { DatabaseError } from "pg";

/* What to hand console.error for a caught error. A failed query prints its
   parameters, and Postgres's `detail` repeats the offending values; either
   can be a person's email, name or Auth0 id, and the host keeps its logs.
   For a query error this keeps what locates the fault (the SQLSTATE code,
   the constraint, the statement with its placeholders) and leaves the
   values out. Anything else is passed through as it is. */
export function forLog(error: unknown): unknown {
  if (!(error instanceof DrizzleQueryError)) return error;
  const cause = error.cause;
  const why =
    cause instanceof DatabaseError
      ? [
          `Postgres ${cause.code ?? "error"}`,
          cause.constraint && `constraint ${cause.constraint}`,
          cause.table && `table ${cause.table}`,
          cause.column && `column ${cause.column}`,
        ]
          .filter(Boolean)
          .join(", ")
      : // Not from the server: a refused or dropped connection, a timeout.
        // A refused connection has an empty message and only a code.
        cause?.message || (cause as { code?: string } | undefined)?.code || cause?.name || "unknown cause";
  return `Query failed (${why}): ${error.query}`;
}
