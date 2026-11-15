import { label } from "@/components/convention/section-heading";
import { cn } from "@/lib/utils";

type Figure = { value: string | number; label: string };

const COLS = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
} as const;

/* A row of figures on the darkest cyan, straight under a photographic
   page intro, as the homepage's figures sit under its mission: the
   figure in the serif over a small gold label, a hairline between each.
   White measures 11.2:1 on
   sky-deep and 7.6:1 at 75%; gold-soft 9.5:1. */
export function FigureBand({
  figures,
  note,
  label: name,
}: {
  figures: Figure[];
  note?: string;
  /** Names the band for assistive tech. */
  label: string;
}) {
  const cols = COLS[figures.length as keyof typeof COLS] ?? COLS[4];
  /* Four figures sit two by two below lg, so the second row needs a rule
     on top and its first figure loses the rule on its left. */
  const twoRows = figures.length === 4;

  return (
    <section aria-label={name} data-header-tone="dark" className="bg-sky-deep text-white">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <dl className={cn("grid", cols)}>
          {figures.map((figure, index) => (
            /* dt before dd, as a dl requires; the column is reversed so
               the figure is drawn above its label. */
            <div
              key={figure.label}
              className={cn(
                "flex min-w-0 flex-col-reverse justify-end py-8 sm:py-12 lg:py-14",
                index > 0 && "border-s border-white/15 ps-4 sm:ps-8",
                index < figures.length - 1 && "pe-4 sm:pe-8",
                twoRows && index === 2 && "border-s-0 ps-0 max-lg:border-t lg:border-s lg:ps-8",
                twoRows && index === 3 && "max-lg:border-t",
              )}
            >
              <dt className={cn(label, "mt-3 max-w-[18ch] text-[0.6875rem] text-gold-soft sm:text-[0.75rem]")}>
                {figure.label}
              </dt>
              <dd className="font-display text-[clamp(2.5rem,6vw,4.5rem)] tabular-nums leading-[0.95] tracking-[-0.03em]">
                {figure.value}
              </dd>
            </div>
          ))}
        </dl>
        {note && <p className="border-t border-white/15 py-5 text-sm text-white/75">{note}</p>}
      </div>
    </section>
  );
}
