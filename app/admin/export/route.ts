import { NextResponse, type NextRequest } from "next/server";
import { STATUS_LABEL } from "@/components/admin/status-badge";
import type { ListFilter } from "@/lib/applications";
import { applicationsCsv } from "@/lib/applications-csv";
import { requireRole } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/db/schema";

/* GET /admin/export?status=… downloads the applications list as CSV. The
   proxy already sends a signed-out visitor to sign in; a signed-in member
   without the admin role lands on the 403 page, as the dashboard does. */

const FILTERS = new Set<string>(["all", ...(Object.keys(STATUS_LABEL) as ApplicationStatus[])]);

export function csvResponse({ csv, filename }: { csv: string; filename: string }) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  await requireRole("admin", "/admin");
  const requested = request.nextUrl.searchParams.get("status") ?? "all";
  const filter = (FILTERS.has(requested) ? requested : "all") as ListFilter;
  return csvResponse(await applicationsCsv(filter));
}
