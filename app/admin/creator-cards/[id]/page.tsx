import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRightIcon, PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { CardDetailSkeleton } from "@/components/admin/card-skeleton";
import { CardStatusBadge, CARD_STATUS_LABEL } from "@/components/admin/card-status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { Chips, Facts, Section, type Fact } from "@/components/admin/section";
import { CreatorCard } from "@/components/creator-card/creator-card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import {
  CARD_CONTENT_TYPES,
  CARD_LANGUAGES,
  COUNTED_SOCIALS,
  cardLabels,
  cardLinks,
  cardPhotoSrc,
  isProfilePicture,
  creatorTypeLabel,
} from "@/lib/creator-card";
import { cardFollowers, cardLinkChecks, getCard, listCardClaims } from "@/lib/creator-cards";
import type { FollowerCheckStatus } from "@/lib/db/schema";
import { formatCount, formatDateTime } from "@/lib/format";
import { presignedGetUrl } from "@/lib/s3";
import { ClaimReview } from "./claim-review";
import { ClaimUndo } from "./claim-undo";
import { ReviewActions } from "./review-actions";

export const metadata: Metadata = { title: "Creator card" };

export default function CreatorCardPage(props: PageProps<"/admin/creator-cards/[id]">) {
  return (
    <Suspense fallback={<CardDetailSkeleton />}>
      <Loaded params={props.params} />
    </Suspense>
  );
}

const link =
  "inline-flex max-w-full items-baseline gap-1 rounded-sm text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/* One card, for review: what it says, how it will look, and the decision.
   The links are the part most worth opening before approving, so each is
   spelled out in full rather than hidden behind an icon. Under each link
   a count is kept for is its follower count, which is read from that link
   every week (Douyin every three months), and what came of the latest
   reading. */
const CHECK_NOTE: Record<FollowerCheckStatus, string> = {
  ok: "Read from the link",
  not_found: "No account was found at this link. Tried",
  unreadable: "No figure could be read for this account. Tried",
  error: "The last attempt failed and will be made again. Tried",
};

async function Loaded({ params }: { params: PageProps<"/admin/creator-cards/[id]">["params"] }) {
  const viewer = await requireRole("admin", "/admin/creator-cards");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const card = await getCard(id);
  if (!card) notFound();

  const languages = cardLabels(CARD_LANGUAGES, card.languages, card.languagesOther);
  const content = cardLabels(CARD_CONTENT_TYPES, card.contentTypes, card.contentTypesOther);
  const links = cardLinks(card.socials);
  const followers = cardFollowers(card);
  const checks = await cardLinkChecks(card);

  // The card's own photo (the creator's upload, or the profile picture the
  // team took for a card it made), or failing that the picture from the
  // owner's sign-in account, which is what the card shows by default.
  const photoUrl = await presignedGetUrl(card.photoKey ?? card.user?.picture);
  const photoSource = card.photoKey
    ? isProfilePicture(card.photoKey)
      ? "Taken by our team from the creator's public profile"
      : "Uploaded by the creator"
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
      const counted = COUNTED_SOCIALS.find((social) => social.value === place);
      const count = counted && followers[counted.value];
      const check = counted && checks[counted.value];
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
        ...(counted
          ? [
              {
                label: `${label} ${counted.audience.toLowerCase()}`,
                value: (
                  <>
                    <span className="tabular-nums">{count == null ? "—" : formatCount(count)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {check
                        ? `${CHECK_NOTE[check.status]} ${formatDateTime(check.checkedAt)}.`
                        : count == null
                          ? "Not read yet."
                          : "Not read yet. This is the figure the card was given."}
                    </span>
                  </>
                ),
              },
            ]
          : []),
      ];
    }),
  ];
  if (links.length === 0) answers.push({ label: "Links", value: null });
  if (card.totalFollowers > 0) {
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
        // Only a card the team made is claimed: this is when the team
        // approved the claim that gave it this owner.
        ...(card.claimedAt ? [{ label: "Claim approved", value: formatDateTime(card.claimedAt) }] : []),
        { label: "Sent for review", value: formatDateTime(card.submittedAt) || null },
        { label: "Version", value: String(card.revision) },
      ]
    : [];

  const claims = await listCardClaims(card.id);
  const waiting = claims.filter((claim) => claim.status === "pending").length;

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
        // A card nobody owns is the team's to keep right.
        actions={
          !card.userId && (
            <Button
              variant="outline"
              size="lg"
              className="px-3"
              nativeButton={false}
              render={<Link href={`/admin/creator-cards/${card.id}/edit`} />}
            >
              <PencilSimpleIcon data-icon="inline-start" aria-hidden />
              Edit card
            </Button>
          )
        }
        className="mb-6"
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Who says this card is theirs. A claim changes nothing until
              it is approved here; it comes first because, when there is
              one waiting, it is what the reviewer came to decide. */}
          {claims.length > 0 && (
            <Section
              id="card-claims-title"
              title="Claims on this card"
              meta={waiting > 0 ? `${waiting} waiting` : undefined}
              bodyClassName="p-0"
            >
              <ul className="divide-y divide-border">
                {claims.map((claim) => {
                  const who = claim.claimant.name ?? claim.claimant.email;
                  const by = claim.reviewer
                    ? claim.reviewer.id === viewer.id
                      ? "you"
                      : (claim.reviewer.name ?? claim.reviewer.email)
                    : null;
                  return (
                    <li key={claim.id} className="flex flex-col gap-4 px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <p className="min-w-0 text-sm font-medium wrap-anywhere text-foreground">{who}</p>
                        <CardStatusBadge status={claim.status} />
                      </div>
                      <Facts
                        items={[
                          {
                            label: "Email",
                            value: (
                              <a href={`mailto:${claim.claimant.email}`} className={link}>
                                <span className="min-w-0 wrap-anywhere">{claim.claimant.email}</span>
                              </a>
                            ),
                          },
                          { label: "Sent", value: formatDateTime(claim.createdAt) },
                          {
                            label: "Code to look for",
                            value: <code className="font-mono font-semibold tracking-[0.06em]">{claim.code}</code>,
                          },
                          { label: "Their note", value: claim.note },
                          ...(claim.status === "pending"
                            ? []
                            : [
                                {
                                  label: "Decided",
                                  value: `${CARD_STATUS_LABEL[claim.status]} ${formatDateTime(claim.reviewedAt)}${by ? ` by ${by}` : ""}`,
                                },
                                { label: "Note to them", value: claim.reviewNote },
                              ]),
                        ]}
                      />
                      {claim.status === "pending" &&
                        (card.userId ? (
                          <p className="text-sm text-muted-foreground">
                            This card has an owner now, so this claim can only be rejected.
                          </p>
                        ) : (
                          <p className="text-sm leading-[1.5] text-muted-foreground">
                            Open the card&rsquo;s {links.length === 1 ? "link" : "links"} below and look for the code in
                            the profile&rsquo;s bio or description. Approve only if it is there, or you have confirmed
                            the claim another way. Approving makes this person the card&rsquo;s owner and rejects any
                            other claim on it.
                          </p>
                        ))}
                      {claim.status === "pending" && <ClaimReview claimId={claim.id} claimant={who} />}
                      {/* The approval that made this person the owner can
                          be taken back for as long as the card is theirs
                          by it. */}
                      {claim.status === "approved" && card.claimedAt && card.userId === claim.userId && (
                        <ClaimUndo
                          claimId={claim.id}
                          claimant={who}
                          cardName={card.displayName}
                          edited={card.submittedAt !== null}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}
          <Section id="card-answers-title" title="What the card says">
            <Facts items={answers} />
          </Section>
          <Section id="card-account-title" title={card.user && !card.claimedAt ? "Who sent it" : "Whose it is"}>
            {card.user ? (
              <Facts items={account} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Our team made this card. Nobody has claimed it yet, so it is not linked to an account.
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
              <CreatorCard card={{ ...card, photoUrl }} verified={card.status === "approved"} />
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
