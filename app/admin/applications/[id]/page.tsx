import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ApplicationDetail } from "@/components/admin/application-detail";
import { getApplication } from "@/lib/applications";
import { requireRole } from "@/lib/auth";
import { presignedGetUrl } from "@/lib/s3";

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
  const videoUrl = application.videoKey ? await presignedGetUrl(application.videoKey) : null;
  return <ApplicationDetail application={application} videoUrl={videoUrl} viewerId={viewer.id} />;
}
