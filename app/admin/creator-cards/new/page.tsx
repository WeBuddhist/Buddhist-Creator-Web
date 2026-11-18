import type { Metadata } from "next";
import { Suspense } from "react";
import { CardEditorSkeleton } from "@/components/admin/card-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { requireRole } from "@/lib/auth";
import { CardEditor } from "../card-editor";

export const metadata: Metadata = { title: "Add a creator" };

/* A new card for a creator our team knows: approved as it is made, and
   nobody's until its creator claims it. */
export default function NewCreatorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Creator cards"
        title="Add a creator"
        description="Make a card for a creator our team knows. It goes on the creators list as soon as you save it, and stays unclaimed until its creator asks for it. A name and one link are enough."
        className="mb-6"
      />
      <Suspense fallback={<CardEditorSkeleton />}>
        <Editor />
      </Suspense>
    </>
  );
}

async function Editor() {
  await requireRole("admin", "/admin/creator-cards/new");
  return <CardEditor card={null} canRemove={false} />;
}
