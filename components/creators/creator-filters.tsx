"use client";

import { startTransition, useId, useOptimistic, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretDownIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CREATORS_PATH,
  SEARCH_MAX,
  creatorsHref,
  sameCreatorsView,
  type CreatorsView,
} from "@/lib/creators";
import { cn } from "@/lib/utils";

const ALL = "";

/** How many countries the chips show before the rest are asked for: the
    fullest ones, about a row of them on a wide screen. */
const COUNTRIES_SHOWN = 8;

/* The field's look, shared with the homepage suggestion box. */
const well = cn(
  "rounded-xl border-input bg-card text-foreground placeholder:text-muted-foreground",
  "transition-[border-color,box-shadow] duration-150 ease-hover",
  "focus-visible:border-brand-cyan focus-visible:ring-3 focus-visible:ring-brand-cyan/20",
);

/* The creators directory's filters, and the cards beneath them: a name
   search and a country filter. The list is paginated, so the server does
   the narrowing and the view lives in the URL (lib/creators.ts); this is
   the part that makes it feel immediate, as the dashboard's applications
   filter does. A chip goes active and the cards dim the moment something
   is pressed or typed, and the page catches up when the navigation lands.
   The optimistic view is bound to the same transition as the navigation,
   so an interrupted one falls back on its own.

   Without scripts it still works: the search is a GET form and every chip
   is a link to the same view. */
export function CreatorFilters({
  view,
  total,
  matching,
  countries,
  children,
}: {
  /** The view the URL asks for, which the cards below were read with. */
  view: CreatorsView;
  /** How many creators there are, whatever the filters. */
  total: number;
  /** How many the filters leave. */
  matching: number;
  countries: { country: string; count: number }[];
  /** The cards and their page links. */
  children: ReactNode;
}) {
  const router = useRouter();
  const id = useId();
  const [shown, setShown] = useOptimistic(view);
  const pending = !sameCreatorsView(shown, view);

  /* The search box keeps what is typed, spaces and all; the URL keeps it
     trimmed. When the URL's search moves without a navigation of ours in
     flight (Back, or the "clear" link under an empty result), the box
     takes it. Derived during render, as the header does for its menu. */
  const [text, setText] = useState(view.q);
  const [urlQuery, setUrlQuery] = useState(view.q);
  if (view.q !== urlQuery) {
    setUrlQuery(view.q);
    if (!pending && view.q !== text.trim()) setText(view.q);
  }

  const go = (next: CreatorsView, how: "push" | "replace" = "push") => {
    if (sameCreatorsView(next, shown)) return;
    startTransition(() => {
      setShown(next);
      // The filters stay where they are on screen; only the cards change.
      router[how](creatorsHref(next, 1, false), { scroll: false });
    });
  };

  const search = (value: string) => {
    setText(value);
    // Typing rewrites one history entry rather than adding one a letter.
    go({ ...shown, q: value.replace(/\s+/g, " ").trim() }, "replace");
  };
  const clear = () => {
    setText("");
    go({ q: "", country: null });
  };

  const filtered = shown.q !== "" || shown.country !== null;
  /* The chips: all countries together, then the fullest few, then the one
     that is chosen if it is not among them, so the choice is always in
     view. The rest wait behind "more countries". */
  const leading = countries.slice(0, COUNTRIES_SHOWN);
  const chosen = countries.find(({ country }) => country === shown.country);
  const chips = [
    { country: ALL, count: total },
    ...leading,
    ...(chosen && !leading.includes(chosen) ? [chosen] : []),
  ];
  const rest = countries.slice(COUNTRIES_SHOWN).filter((entry) => entry !== chosen);

  const chip = ({ country, count }: { country: string; count: number }) => {
    const active = (shown.country ?? ALL) === country;
    const next = { ...shown, country: country || null };
    return (
      <li key={country}>
        <Link
          href={creatorsHref(next)}
          // A chip that stays in view as the cards change: no jump.
          scroll={false}
          aria-current={active ? "true" : undefined}
          onNavigate={(event) => {
            event.preventDefault();
            go(next);
          }}
          className={cn(
            "inline-flex h-9 select-none items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium",
            "transition-[background-color,border-color,color] duration-150 ease-hover",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            active
              ? "border-brand-cyan bg-brand-cyan text-white"
              : "border-border bg-card text-foreground hover:border-ink/30",
          )}
        >
          {country === ALL ? "All" : country}
          <span className={cn("tabular-nums", active ? "text-white/75" : "text-muted-foreground")}>{count}</span>
        </Link>
      </li>
    );
  };

  return (
    <div className="mt-10 lg:mt-12">
      {/* The search, and under it the countries: one after the other, so
          the filters stay a few lines tall however many countries there
          are. */}
      <div className="flex flex-col gap-5 border-y border-border py-5">
        <form
          role="search"
          action={CREATORS_PATH}
          onSubmit={(event) => {
            event.preventDefault();
            search(text);
          }}
          className="flex flex-col gap-2 sm:max-w-md"
        >
          <Label htmlFor={`${id}-search`} className="text-foreground">
            Search by name
          </Label>
          <div className="relative">
            <MagnifyingGlassIcon
              aria-hidden
              className="pointer-events-none absolute inset-s-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id={`${id}-search`}
              name="q"
              type="search"
              value={text}
              onChange={(event) => search(event.target.value)}
              maxLength={SEARCH_MAX}
              autoComplete="off"
              spellCheck={false}
              placeholder="Tenzin, Rinpoche, Dharma…"
              className={cn(well, "h-12 ps-10 pe-3.5")}
            />
          </div>
          {/* Carried along when the form is sent without scripts. */}
          {shown.country && <input type="hidden" name="country" value={shown.country} />}
        </form>

        {/* Phones: one native select, which the platform opens as its own
            picker. Wider screens: the countries as a row of chips. Both
            lead to the same views; the hidden one leaves the tree. */}
        <div className="flex flex-col gap-2 sm:hidden">
          <Label htmlFor={`${id}-country`} className="text-foreground">
            Country
          </Label>
          <div className="relative">
            <select
              id={`${id}-country`}
              value={shown.country ?? ALL}
              onChange={(event) => go({ ...shown, country: event.target.value || null })}
              className={cn(well, "h-12 w-full appearance-none border bg-card ps-3.5 pe-10 text-base outline-none")}
            >
              <option value={ALL}>All countries ({total})</option>
              {countries.map(({ country, count }) => (
                <option key={country} value={country}>
                  {country} ({count})
                </option>
              ))}
            </select>
            <CaretDownIcon
              aria-hidden
              weight="bold"
              className="pointer-events-none absolute inset-e-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>

        <nav aria-label="Filter by country" className="hidden min-w-0 sm:block">
          <p className="mb-2 text-sm font-medium text-foreground">Country</p>
          <ul className="flex flex-wrap gap-2">{chips.map(chip)}</ul>
          {/* The other countries, behind a disclosure of the browser's own:
              it opens from the keyboard and without scripts, and says how
              many it holds. */}
          {rest.length > 0 && (
            <details className="group mt-3">
              <summary
                className={cn(
                  "inline-flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-full px-1 text-sm font-medium text-brand-cyan select-none [&::-webkit-details-marker]:hidden",
                  "underline decoration-current/35 underline-offset-[5px] transition-[text-decoration-color] duration-150 ease-hover hover:decoration-current",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                )}
              >
                <span className="group-open:hidden">
                  {rest.length === 1 ? "1 more country" : `${rest.length} more countries`}
                </span>
                <span className="hidden group-open:inline">Fewer countries</span>
                <CaretDownIcon
                  aria-hidden
                  weight="bold"
                  className="size-3.5 transition-[rotate] duration-150 ease-out group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <ul className="mt-2 flex flex-wrap gap-2">{rest.map(chip)}</ul>
            </details>
          )}
        </nav>
      </div>

      {/* The count is announced as it changes; the clear button sits
          beside it once anything is narrowed. */}
      <div className="flex min-h-11 items-center justify-between gap-4 pt-5">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {filtered ? (
            <>
              Showing <span className="font-semibold tabular-nums text-foreground">{matching}</span> of{" "}
              <span className="tabular-nums">{total}</span> creators
            </>
          ) : (
            <>
              <span className="font-semibold tabular-nums text-foreground">{total}</span>{" "}
              {total === 1 ? "creator" : "creators"}
              {countries.length > 1 && (
                <>
                  {" "}
                  from <span className="tabular-nums">{countries.length}</span> countries
                </>
              )}
            </>
          )}
        </p>
        {filtered && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-brand-cyan underline decoration-current/35 underline-offset-[5px] transition-[text-decoration-color] duration-150 ease-hover hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <XIcon aria-hidden weight="bold" className="size-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* The cards of the view that was asked for last, dimmed until the
          ones just asked for arrive. */}
      <div
        aria-busy={pending || undefined}
        className={cn("transition-opacity duration-150 ease-hover", pending && "opacity-50")}
      >
        {children}
      </div>
    </div>
  );
}
