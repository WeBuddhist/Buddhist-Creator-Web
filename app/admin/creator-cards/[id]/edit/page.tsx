import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardEditSkeleton } from "@/components/admin/card-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { panel } from "@/components/admin/panel";
import { hasRole, requireRole } from "@/lib/auth";
import { cardFollowers, cardLinkChecks, getCard } from "@/lib/creator-cards";
import { presignedGetUrl } from "@/lib/s3";
import { cn } from "@/lib/utils";
import { CardEditor, type EditorCard } from "../../card-editor";

export const metadata: Metadata = { title: "Edit creator card" };

/* Changing a card nobody owns: its name, country, line, links and photo.
   A card with an owner is the creator's to change, so it is not opened
   here. */
export default function EditCreatorCardPage(props: PageProps<"/admin/creator-cards/[id]/edit">) {
  return (
    <Suspense fallback={<CardEditSkeleton />}>
      <Loaded params={props.params} />
    </Suspense>
  );
}

async function Loaded({ params }: { params: PageProps<"/admin/creator-cards/[id]/edit">["params"] }) {
  const viewer = await requireRole("admin", "/admin/creator-cards");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const card = await getCard(id);
  if (!card) notFound();

  const back = `/admin/creator-cards/${card.id}`;
  if (card.userId) {
    return (
      <>
        <PageHeader
          eyebrow="Creator card"
          title={<span className="wrap-anywhere">{card.displayName}</span>}
          className="mb-6"
        />
        <div className={cn(panel, "px-5 py-6 text-sm leading-[1.6]")}>
          <p className="text-foreground">
            This card belongs to its creator{card.user?.email ? ` (${card.user.email})` : ""}, so only they can change
            it, from their own card page.
          </p>
          <p className="mt-3">
            <Link
              href={back}
              className="font-medium text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground"
            >
              Back to the card
            </Link>
          </p>
        </div>
      </>
    );
  }

  const [photoUrl, checks] = await Promise.all([presignedGetUrl(card.photoKey), cardLinkChecks(card)]);
  const editorCard: EditorCard = {
    id: card.id,
    displayName: card.displayName,
    country: card.country,
    tagline: card.tagline,
    socials: card.socials,
    photoUrl,
    followers: cardFollowers(card),
    totalFollowers: card.totalFollowers,
    checks: Object.fromEntries(
      Object.entries(checks).map(([place, check]) => [
        place,
        { status: check.status, checkedAt: check.checkedAt.toISOString() },
      ]),
    ),
  };

  return (
    <>
      <PageHeader
        eyebrow="Edit creator card"
        title={<span className="wrap-anywhere">{card.displayName}</span>}
        description="Our team made this card and nobody has claimed it, so it is ours to keep right. Changes show on the creators list as soon as you save."
        className="mb-6"
      />
      <CardEditor card={editorCard} canRemove={hasRole(viewer, "superadmin")} />
    </>
  );
}
