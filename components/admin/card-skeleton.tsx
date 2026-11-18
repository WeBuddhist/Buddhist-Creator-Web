import { panel } from "@/components/admin/panel";
import { Section } from "@/components/admin/section";
import { cn } from "@/lib/utils";

/* What the creator card pages show while a card is being read: the page's
   own frame, with its panels and their titles in place and grey bars
   where the card's words will be, so the page settles without a jump when
   the card arrives. The bars pulse only where motion is welcome. Like the
   applications table's skeleton (applications-skeleton.tsx), each is one
   status region with a name, and the bars themselves say nothing. */

const bar = "block h-3.5 rounded bg-muted";
const box = "block h-11 rounded-lg bg-muted";
const pulse = "motion-safe:animate-pulse";

/** The top of a card page: the eyebrow as it will read, and bars for the
    creator's name and the line under it. */
function HeaderSkeleton({ eyebrow, description = false }: { eyebrow: string; description?: boolean }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-medium tracking-[0.05em] text-brand-cyan uppercase">{eyebrow}</p>
      <div className={cn("mt-1 flex h-8 items-center gap-3", pulse)}>
        <span className={cn(bar, "h-6 w-64 max-w-full")} />
      </div>
      {description && (
        <div className={cn("mt-1.5 flex max-w-[64ch] flex-col gap-2 py-1", pulse)}>
          <span className={cn(bar, "w-full")} />
          <span className={cn(bar, "w-2/3")} />
        </div>
      )}
    </div>
  );
}

/** A label over its field. */
function FieldSkeleton({ label, hint = false }: { label: string; hint?: boolean }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className={cn(bar, label)} />
      <span className={box} />
      {hint && <span className={cn(bar, "h-3 w-3/4 opacity-70")} />}
    </div>
  );
}

/** The creator card itself, as a shape: the photo, the name, a line and the links. */
function CardShape() {
  return (
    <div className={cn("rounded-2xl bg-muted/40 p-1", pulse)}>
      <div className="flex flex-col rounded-xl bg-card p-5 shadow-border sm:p-6">
        <span className="block size-26 rounded-full bg-muted" />
        <span className={cn(bar, "mt-5 h-6 w-48 max-w-full")} />
        <span className={cn(bar, "mt-3 w-32")} />
        <span className="mt-4 flex gap-2">
          <span className="block size-9 rounded-full bg-muted" />
          <span className="block size-9 rounded-full bg-muted" />
          <span className="block size-9 rounded-full bg-muted" />
        </span>
        <span className={cn(bar, "mt-4 w-full")} />
        <span className={cn(bar, "mt-2 w-2/3")} />
      </div>
    </div>
  );
}

/** The editor's two columns: the form's panels, and the card beside them. */
export function CardEditorSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading the editor"
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <Section id="editor-who-skeleton" title="Who they are" bodyClassName={cn("flex flex-col gap-6 py-5", pulse)}>
          <div className="flex flex-col gap-3">
            <span className={cn(bar, "w-12")} />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
              <span className="block size-20 shrink-0 rounded-full bg-muted" />
              <div className="flex min-w-0 flex-1 basis-56 flex-col gap-2.5">
                <span className="block h-9 w-36 rounded-lg bg-muted" />
                <span className={cn(bar, "h-3 w-full max-w-sm opacity-70")} />
              </div>
            </div>
          </div>
          <FieldSkeleton label="w-14" hint />
          <FieldSkeleton label="w-16" />
          <FieldSkeleton label="w-40" hint />
        </Section>
        <Section id="editor-links-skeleton" title="Where to find them" bodyClassName={cn("flex flex-col gap-5 py-5", pulse)}>
          <div className="flex max-w-[68ch] flex-col gap-2">
            <span className={cn(bar, "w-full")} />
            <span className={cn(bar, "w-5/6")} />
          </div>
          {/* The four counted places, each a link with its count beside it. */}
          {["w-20", "w-24", "w-16", "w-24"].map((label, index) => (
            <div key={index} className="grid gap-x-5 gap-y-2.5 sm:grid-cols-[minmax(0,1fr)_11rem]">
              <FieldSkeleton label={label} />
              <FieldSkeleton label="w-20" />
            </div>
          ))}
          <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
            <FieldSkeleton label="w-8" />
            <FieldSkeleton label="w-16" />
          </div>
        </Section>
        <div className={cn("flex gap-2", pulse)}>
          <span className="block h-9 w-32 rounded-lg bg-muted" />
          <span className="block h-9 w-20 rounded-lg bg-muted" />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-6">
        <Section id="editor-preview-skeleton" title="How it will look">
          <CardShape />
        </Section>
      </div>
    </div>
  );
}

/** The edit page before its card is read: the header, then the editor. */
export function CardEditSkeleton() {
  return (
    <>
      <HeaderSkeleton eyebrow="Edit creator card" description />
      <CardEditorSkeleton />
    </>
  );
}

/** A row of the card's answers: the label, and what it says. */
function FactSkeleton({ value }: { value: string }) {
  return (
    <div className="grid gap-1 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-4">
      <span className={cn(bar, "my-[3px] w-24")} />
      <span className={cn(bar, "my-[3px]", value)} />
    </div>
  );
}

/** A card's own page before the card is read: what it says and whose it
    is on the left, the review and the card on the right. */
export function CardDetailSkeleton() {
  return (
    <>
      <HeaderSkeleton eyebrow="Creator card" />
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading the creator card"
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <Section id="card-answers-skeleton" title="What the card says" bodyClassName={pulse}>
            <div className="divide-y divide-border">
              {["w-56", "w-40", "w-24", "w-64", "w-72 max-w-full", "w-20", "w-72 max-w-full", "w-20", "w-28"].map(
                (value, index) => (
                  <FactSkeleton key={index} value={value} />
                ),
              )}
            </div>
          </Section>
          <Section id="card-account-skeleton" title="Whose it is" bodyClassName={pulse}>
            <span className={cn(bar, "w-3/4")} />
          </Section>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <section className={panel} aria-hidden>
            <header className="flex min-h-12 items-center rounded-t-[inherit] border-b border-border bg-muted/60 px-5 py-2.5">
              <p className="text-sm font-medium text-foreground">Review</p>
            </header>
            <div className={cn("flex flex-col gap-4 px-5 py-4", pulse)}>
              <span className={cn(bar, "w-32")} />
              <span className="block h-20 rounded-lg bg-muted" />
              <span className="flex gap-2">
                <span className="block h-9 w-24 rounded-lg bg-muted" />
                <span className="block h-9 w-20 rounded-lg bg-muted" />
              </span>
            </div>
          </section>
          <Section id="card-preview-skeleton" title="How it will look">
            <CardShape />
          </Section>
        </div>
      </div>
    </>
  );
}

/* The list of creator cards with its rows replaced by placeholders: the
   same five columns, and two lines in the creator's cell (the name, and
   who owns the card), so a placeholder row is as tall as a real one. */
const ROW_WIDTHS = [
  ["w-40", "w-24", "w-20"],
  ["w-32", "w-20", "w-24"],
  ["w-48", "w-28", "w-16"],
];

export function CardsTableSkeleton({ rows, className }: { rows: number; className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading creator cards"
      className={cn(panel, "overflow-x-auto", className)}
    >
      <table className="w-full min-w-[44rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">
            <th scope="col" className="px-4 py-3">Creator</th>
            <th scope="col" className="px-4 py-3">Creates as</th>
            <th scope="col" className="px-4 py-3">Country</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Sent</th>
          </tr>
        </thead>
        <tbody className={pulse}>
          {Array.from({ length: Math.max(1, rows) }, (_, index) => {
            const [name, type, country] = ROW_WIDTHS[index % ROW_WIDTHS.length];
            return (
              <tr key={index} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <span className={cn(bar, name, "my-[3px]")} />
                  <span className={cn(bar, "mt-1.5 h-3 w-36 opacity-70")} />
                </td>
                <td className="px-4 py-3">
                  <span className={cn(bar, type)} />
                </td>
                <td className="px-4 py-3">
                  <span className={cn(bar, country)} />
                </td>
                <td className="px-4 py-3">
                  <span className="block h-6 w-24 rounded-full bg-muted" />
                </td>
                <td className="px-4 py-3">
                  <span className={cn(bar, "w-28")} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The search and the tabs before the list is known: the same controls,
    inert, so the page loads without a jump. */
export function CardsFilterSkeleton({ labels }: { labels: string[] }) {
  return (
    <div aria-hidden="true">
      <div className="mb-4 flex max-w-md items-center gap-2">
        <span className="block h-9 min-w-0 flex-1 rounded-lg bg-muted" />
        <span className="block h-9 w-20 rounded-lg bg-muted" />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {labels.map((label, index) => (
          <span
            key={label}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border border-transparent px-3.5 text-sm font-medium shadow-ring select-none",
              index === 0 ? "bg-brand-cyan text-white shadow-none" : "bg-card text-foreground",
            )}
          >
            {label}
            <span className={cn("inline-block h-3 w-3 rounded", index === 0 ? "bg-white/30" : "bg-muted")} />
          </span>
        ))}
      </div>
    </div>
  );
}
