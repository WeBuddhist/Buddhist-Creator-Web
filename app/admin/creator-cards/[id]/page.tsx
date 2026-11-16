import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { CardStatusBadge, CARD_STATUS_LABEL } from "@/components/admin/card-status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { Chips, Facts, Section, type Fact } from "@/components/admin/section";
import { CreatorCard } from "@/components/creator-card/creator-card";
import { requireRole } from "@/lib/auth";
import {
  CARD_CONTENT_TYPES,
  CARD_LANGUAGES,
  cardAudiences,
  cardLabels,
  cardLinks,
  cardPhotoSrc,
  creatorTypeLabel,
} from "@/lib/creator-card";
import { cardFollowers, getCard } from "@/lib/creator-cards";
import { formatCount, formatDateTime } from "@/lib/format";
import { presignedGetUrl } from "@/lib/s3";
import { ReviewActions } from "./review-actions";

export const metadata: Metadata = { title: "Creator card" };

export default function CreatorCardPage(props: PageProps<"/admin/creator-cards/[id]">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading creator card…</p>}>
      <Loaded params={props.params} />
    </Suspense>
  );
}

const link =
  "inline-flex max-w-full items-baseline gap-1 rounded-sm text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/* One card, for review: what it says, how it will look, and the decision.
   The links are the part most worth opening before approving, so each is
   spelled out in full rather than hidden behind an icon. The follower
   counts are the creator's own figures, each listed under the link it can
   be checked against. */
async function Loaded({ params }: { params: PageProps<"/admin/creator-cards/[id]">["params"] }) {
  const viewer = await requireRole("admin", "/admin/creator-cards");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const card = await getCard(id);
  if (!card) notFound();

  const languages = cardLabels(CARD_LANGUAGES, card.languages, card.languagesOther);
  const content = cardLabels(CARD_CONTENT_TYPES, card.contentTypes, card.contentTypesOther);
  const links = cardLinks(card.socials);
  const audiences = cardAudiences(cardFollowers(card));

  // The creator's own upload, or failing that the picture from their
  // sign-in account, which is what the card shows by default.
  const photoUrl = await presignedGetUrl(card.photoKey ?? card.user?.picture);
  const photoSource = card.photoKey
    ? "Uploaded by the creator"
    : card.user?.picture
      ? "The picture from their sign-in account"
      : null;

  const answers: Fact[] = [
    {
      label: "Photo",
      value: photoSource && photoUrl && (
        <>
          {photoSource}.{" "}
          <a href={cardPhotoSrc(photoUrl) ?? photoUrl} target="_blank" rel="noopener noreferrer" className={link}>
            View it full size
            <ArrowUpRightIcon aria-hidden weight="bold" className="size-3 shrink-0 self-center text-muted-foreground" />
            <span className="sr-only">(opens in new tab)</span>
          </a>
        </>
      ),
    },
    { label: "Display name", value: card.displayName },
    { label: "Country", value: card.country },
    { label: "Creates as", value: creatorTypeLabel(card.creatorType) },
    { label: "Publishes in", value: languages.length > 0 ? <Chips items={languages} /> : null },
    { label: "Content", value: content.length > 0 ? <Chips items={content} /> : null },
    { label: "One line", value: card.tagline },
    ...links.flatMap(({ value: place, label, url }) => {
      const audience = audiences.find((counted) => counted.value === place);
      return [
        {
          label,
          value: (
            <a href={url} target="_blank" rel="noopener noreferrer nofollow" className={link}>
              <span className="min-w-0 wrap-anywhere">{url}</span>
              <ArrowUpRightIcon
                aria-hidden
                weight="bold"
                className="size-3 shrink-0 self-center text-muted-foreground"
              />
              <span className="sr-only">(opens in new tab)</span>
            </a>
          ),
        },
        ...(audience ? [{ label: audience.label, value: <span className="tabular-nums">{audience.count}</span> }] : []),
      ];
    }),
  ];
  if (links.length === 0) answers.push({ label: "Links", value: null });
  if (audiences.length > 0) {
    answers.push({
      label: "Total followers",
      value: <span className="font-medium tabular-nums">{formatCount(card.totalFollowers)}</span>,
    });
  }

  const account: Fact[] = card.user
    ? [
        { label: "Signed in as", value: card.user.name },
        {
          label: "Email",
          value: (
            <a href={`mailto:${card.user.email}`} className={link}>
              <span className="min-w-0 wrap-anywhere">{card.user.email}</span>
            </a>
          ),
        },
        { label: "Sent for review", value: formatDateTime(card.submittedAt) || null },
        { label: "Version", value: String(card.revision) },
      ]
    : [];

  const reviewer = card.reviewer
    ? card.reviewer.id === viewer.id
      ? "you"
      : (card.reviewer.name ?? card.reviewer.email)
    : null;
  const reviewed =
    card.status !== "pending" && card.reviewedAt
      ? `${CARD_STATUS_LABEL[card.status]} ${formatDateTime(card.reviewedAt)}${reviewer ? ` by ${reviewer}` : ""}`
      : null;

  return (
    <>
      <PageHeader
        eyebrow="Creator card"
        title={<span className="wrap-anywhere">{card.displayName}</span>}
        badge={<CardStatusBadge status={card.status} />}
        className="mb-6"
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <Section id="card-answers-title" title="What the card says">
            <Facts items={answers} />
          </Section>
          <Section id="card-account-title" title="Who sent it">
            {card.user ? (
              <Facts items={account} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nobody has claimed this card yet, so it is not linked to an account.
              </p>
            )}
          </Section>
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
          <Section id="card-review-title" title="Review" bodyClassName="p-0">
            <ReviewActions
              cardId={card.id}
              revision={card.revision}
              status={card.status}
              reviewNote={card.reviewNote}
              reviewed={reviewed}
            />
          </Section>
          <Section id="card-preview-title" title="How it will look">
            {/* The public site's own text face, so the card reads here as
                it will there. */}
            <div className="font-[family-name:var(--font-instrument),ui-sans-serif,system-ui,sans-serif]">
              <CreatorCard card={{ ...card, photoUrl }} />
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
