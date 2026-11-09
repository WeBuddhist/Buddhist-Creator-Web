import {
  CalendarBlankIcon,
  EnvelopeSimpleIcon,
  MapPinIcon,
  TranslateIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { card, cardInner } from "@/components/convention/section-heading";
import { FORM } from "@/lib/registration-2027";
import { cn } from "@/lib/utils";

const FACT_ICONS: Record<(typeof FORM.facts)[number]["icon"], Icon> = {
  venue: MapPinIcon,
  dates: CalendarBlankIcon,
  language: TranslateIcon,
  participants: UsersThreeIcon,
};

const iconWell = "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full";

/** The venue / dates / language / headcount card beside the registration intro. */
export function ConventionFacts() {
  return (
    <aside className={card} aria-label="Convention details">
      <dl className={cn(cardInner, "flex flex-col gap-4 px-5 py-5 text-base leading-[1.5]")}>
        {FORM.facts.map(({ icon, label, value }) => {
          const FactIcon = FACT_ICONS[icon];
          return (
            <div key={label} className="flex items-start gap-3">
              <span
                aria-hidden
                className={cn(iconWell, "bg-brand-cyan/10 text-brand-cyan")}
              >
                <FactIcon className="size-[1.125rem]" weight="duotone" />
              </span>
              <div className="flex min-w-0 flex-col">
                <dt className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">{label}</dt>
                <dd className="text-foreground">{value}</dd>
              </div>
            </div>
          );
        })}
        <div className="mt-1 flex flex-col border-t border-border pt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <EnvelopeSimpleIcon aria-hidden className="size-4 shrink-0" weight="duotone" />
            Questions?
          </span>
          <a
            href={`mailto:${FORM.contact}`}
            className="w-fit break-all font-medium text-foreground underline underline-offset-4"
          >
            {FORM.contact}
          </a>
        </div>
      </dl>
    </aside>
  );
}
