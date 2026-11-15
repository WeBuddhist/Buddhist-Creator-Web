"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import { CaretDownIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Creator } from "@/lib/people";

const ALL = "all";

/* Folds case and accents, so "dieu" finds "Diệu" and "THUPTEN" finds
   "Thupten". */
function fold(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/* The field's look, shared with the homepage suggestion box. */
const well = cn(
  "rounded-xl border-input bg-card text-foreground placeholder:text-muted-foreground",
  "transition-[border-color,box-shadow] duration-150 ease-hover",
  "focus-visible:border-brand-cyan focus-visible:ring-3 focus-visible:ring-brand-cyan/20",
);

/* The creators wall, made findable: a name search and a country filter
   over the full list. The server renders every name, so the list reads
   and indexes without scripts; filtering only narrows it. */
export function CreatorDirectory({ creators }: { creators: Creator[] }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string>(ALL);
  const deferredQuery = useDeferredValue(query);
  const id = useId();

  /* Countries by how many creators each has, most first; ties by name. */
  const countries = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { country: c } of creators) counts.set(c, (counts.get(c) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [creators]);

  const shown = useMemo(() => {
    const needle = fold(deferredQuery.trim());
    return creators.filter(
      (creator) =>
        (country === ALL || creator.country === country) &&
        (needle === "" || fold(creator.name).includes(needle)),
    );
  }, [creators, country, deferredQuery]);

  const filtered = query.trim() !== "" || country !== ALL;
  const clear = () => {
    setQuery("");
    setCountry(ALL);
  };

  return (
    <div className="mt-10 lg:mt-12">
      <div className="flex flex-col gap-5 border-y border-border py-5 lg:flex-row lg:items-start lg:gap-8">
        <div className="flex flex-col gap-2 lg:w-80 lg:shrink-0">
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
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="Tenzin, Shakya, Sherpa…"
              className={cn(well, "h-12 ps-10 pe-3.5")}
            />
          </div>
        </div>

        {/* Phones: one native select, which the platform opens as its own
            picker. Wider screens: the countries as a row of chips. Both
            drive the same state; the hidden one leaves the tree. */}
        <div className="flex flex-col gap-2 sm:hidden">
          <Label htmlFor={`${id}-country`} className="text-foreground">
            Country
          </Label>
          <div className="relative">
            <select
              id={`${id}-country`}
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className={cn(
                well,
                "h-12 w-full appearance-none border bg-card ps-3.5 pe-10 text-base outline-none",
              )}
            >
              <option value={ALL}>All countries ({creators.length})</option>
              {countries.map(([name, count]) => (
                <option key={name} value={name}>
                  {name} ({count})
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

        <fieldset className="hidden min-w-0 sm:block">
          <legend className="mb-2 text-sm font-medium text-foreground">Country</legend>
          <div className="flex flex-wrap gap-2">
            {[[ALL, creators.length] as const, ...countries].map(([value, count]) => {
              const checked = country === value;
              return (
                <label
                  key={value}
                  className={cn(
                    "inline-flex h-9 cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium",
                    "transition-[background-color,border-color,color] duration-150 ease-hover",
                    "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
                    checked
                      ? "border-brand-cyan bg-brand-cyan text-white"
                      : "border-border bg-card text-foreground hover:border-ink/30",
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-country-chip`}
                    value={value}
                    checked={checked}
                    onChange={() => setCountry(value)}
                    className="sr-only"
                  />
                  {value === ALL ? "All" : value}
                  <span className={cn("tabular-nums", checked ? "text-white/75" : "text-muted-foreground")}>
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* The count is announced as it changes; the clear button sits
          beside it once anything is narrowed. */}
      <div className="flex min-h-11 items-center justify-between gap-4 pt-5">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {filtered ? (
            <>
              Showing <span className="font-semibold tabular-nums text-foreground">{shown.length}</span> of{" "}
              <span className="tabular-nums">{creators.length}</span> creators
            </>
          ) : (
            <>
              <span className="font-semibold tabular-nums text-foreground">{creators.length}</span> creators from{" "}
              <span className="tabular-nums">{countries.length}</span> countries
            </>
          )}
        </p>
        {filtered && shown.length > 0 && (
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

      {shown.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-6">
          {shown.map(({ name, country: from }) => (
            <li key={name} className="min-w-0 border-t border-border pt-3">
              <p className="text-pretty text-base font-medium leading-[1.35] text-foreground">{name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{from}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl bg-paper-deep px-6 py-10 text-center sm:py-14">
          <p className="font-display text-2xl leading-[1.2] text-foreground">No creator matches that search</p>
          <p className="mx-auto mt-2 max-w-[44ch] text-pretty text-base leading-[1.6] text-muted-foreground">
            Try part of a name, or look across every country.
          </p>
          <button
            type="button"
            onClick={clear}
            className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-full border border-ink/25 px-5 text-[0.9375rem] font-medium text-foreground transition-[background-color] duration-150 ease-hover hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
