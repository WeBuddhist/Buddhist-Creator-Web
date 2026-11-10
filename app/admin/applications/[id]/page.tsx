import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ApplicationDetail } from "@/components/admin/application-detail";
import { getApplication } from "@/lib/applications";
import { requireRole } from "@/lib/auth";
import { unsettledAttempt } from "@/lib/notifications";
import { presignedGetUrl } from "@/lib/s3";
import { delivery } from "@/lib/ses";

export const metadata: Metadata = { title: "Application" };

export default function ApplicationPage(props: PageProps<"/admin/applications/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading application…</p>}>
      <Loaded params={props.params} />
    </Suspense>
  );
}

/* Loads one application and hands it to the view. The view lives in
   components/admin/application-detail.tsx, where it can be rendered with
   made-up data as well as this real row. */
async function Loaded({ params }: { params: PageProps<"/admin/applications/[id]">["params"] }) {
  const viewer = await requireRole("admin", "/admin");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const application = await getApplication(id);
  if (!application) notFound();
  const [videoUrl, unsettled] = await Promise.all([
    application.videoKey ? presignedGetUrl(application.videoKey) : null,
    unsettledAttempt(id),
  ]);
  const { mode, note } = delivery();
  return (
    <ApplicationDetail
      application={application}
      videoUrl={videoUrl}
      viewerId={viewer.id}
      delivery={{ canSend: mode === "live" || mode === "simulate", note }}
      unsettledAttempt={unsettled}
    />
  );
}
