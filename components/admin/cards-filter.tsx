"use client";

import { startTransition, useOptimistic, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { CardsTableSkeleton } from "@/components/admin/card-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CARDS_PATH,
  CARDS_SEARCH_MAX,
  cardsHref,
  cleanSearch,
  defaultTab,
  sameCardsView,
  type CardsTab,
  type CardsView,
} from "@/lib/creator-cards-view";
import { cn } from "@/lib/utils";

export type CardsTabOption = { value: CardsTab; label: string; count: number };

/* The search and the tabs over the list of creator cards, and the list
   under them. A search or a tab only changes the URL's search, so left to
   itself the router would hold the old rows on screen until the new ones
   came, and before that the whole page gave way to its loading line.
   Here the view turns over the moment it is asked for, as the
   applications list does (applications-filter.tsx): the tab goes active,
   the search and the tabs stay where they are, and only the table gives
   way, to a skeleton, until the navigation lands and `view` catches up.
   The optimistic view is bound to the same transition as the navigation,
   so an interrupted or failed one falls back on its own.

   Without scripts it still works: the search is a GET form and every tab
   a link to the same view. */
export function CardsFilter({
  view,
  options,
  matching,
  pageSize,
  children,
}: {
  /** The view the URL asks for, which the rows below were read with. */
  view: CardsView;
  options: CardsTabOption[];
  /** How many cards that view holds. */
  matching: number;
  pageSize: number;
  /** The table and its page links. */
  children: ReactNode;
}) {
  const router = useRouter();
  const [shown, setShown] = useOptimistic(view);
  const pending = !sameCardsView(shown, view);

  /* The box keeps what is typed. When the URL's search moves without a
     navigation of ours in flight (Back, say), the box takes it. Derived
     during render, as the public directory's search does. */
  const [text, setText] = useState(view.q);
  const [urlQuery, setUrlQuery] = useState(view.q);
  if (view.q !== urlQuery) {
    setUrlQuery(view.q);
    if (!pending && view.q !== cleanSearch(text)) setText(view.q);
  }

  const go = (next: CardsView) => {
    if (sameCardsView(next, shown)) return;
    startTransition(() => {
      setShown(next);
      router.push(cardsHref(next), { scroll: false });
    });
  };

  const search = (typed: string) => {
    const q = cleanSearch(typed);
    // A tab that was only the default follows the search's own default;
    // one the admin chose stays.
    const status = shown.status === defaultTab(shown.q) ? defaultTab(q) : shown.status;
    go({ status, q });
  };

  // How many rows to stand in for: a tab's own count, or a few for a search.
  const target = options.find((option) => option.value === shown.status);
  const rows = shown.q ? 3 : Math.min(target?.count ?? 3, pageSize);

  return (
    <>
      {/* Finding one creator among hundreds: a part of the name. */}
      <form
        action={CARDS_PATH}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          search(text);
        }}
        className="mb-4 flex max-w-md items-center gap-2"
      >
        <label htmlFor="card-search" className="sr-only">
          Search creators by name
        </label>
        <div className="relative min-w-0 flex-1">
          <MagnifyingGlassIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="card-search"
            name="q"
            type="search"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              // Emptying the box, by hand or by its own clear button, is asking for the whole list.
              if (event.target.value === "" && shown.q) search("");
            }}
            maxLength={CARDS_SEARCH_MAX}
            placeholder="Search by name"
            autoComplete="off"
            className="h-9 ps-9"
          />
        </div>
        {/* Carried along when the form is sent without scripts. */}
        {shown.status !== defaultTab(shown.q) && <input type="hidden" name="status" value={shown.status} />}
        <Button type="submit" variant="outline" size="lg" className="px-3">
          Search
        </Button>
      </form>

      {/* What the search found, said once the rows are in. */}
      <p role="status" className={cn("mb-4 text-sm text-muted-foreground", !shown.q && "hidden")}>
        {shown.q &&
          (pending ? (
            <>Searching for “{shown.q}”…</>
          ) : (
            <>
              {matching === 1 ? "1 card has" : `${matching} cards have`} “{view.q}” in the name.{" "}
              <button
                type="button"
                onClick={() => {
                  setText("");
                  search("");
                }}
                className="cursor-pointer rounded-sm font-medium text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Clear the search
              </button>
            </>
          ))}
      </p>

      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === shown.status;
          const next = { ...shown, status: option.value };
          return (
            <Link
              key={option.value}
              href={cardsHref(next)}
              aria-current={active ? "page" : undefined}
              onNavigate={(event) => {
                // The active tab stays a plain link: it leads back to page one.
                if (active) return;
                event.preventDefault();
                go(next);
              }}
              className={cn(
                "inline-flex h-9 select-none items-center gap-1.5 rounded-full border border-transparent bg-card px-3.5 text-sm font-medium text-foreground shadow-ring",
                "transition-[color,background-color] duration-150 ease-hover hover:bg-muted",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active && "bg-brand-cyan text-white shadow-none hover:bg-brand-cyan",
              )}
            >
              {option.label}
              <span className={cn("text-xs tabular-nums", active ? "text-white/80" : "text-muted-foreground")}>
                {option.count}
              </span>
            </Link>
          );
        })}
      </nav>

      {pending ? <CardsTableSkeleton rows={rows} /> : children}
    </>
  );
}
