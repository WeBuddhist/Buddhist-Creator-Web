"use client";

import * as React from "react";
import { Combobox } from "@base-ui/react/combobox";
import { CaretDownIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* The fields the site's long forms share: the registration form
   (app/(site)/convention/2027/register) and the creator card
   (app/(site)/creator-card). Each is controlled, names its input after its
   id, and says what is wrong in words under the field. */

export const field = "h-11 px-3.5";
export const readOnlyField = "bg-muted/50";
export const errorText = "text-sm text-brand-maroon";

export function RequiredMark() {
  return (
    <span className="ml-1 text-brand-maroon" aria-hidden>
      *
    </span>
  );
}

export function TextField({
  id,
  label,
  hint,
  required,
  error,
  value,
  onChange,
  className,
  readOnly,
  ...rest
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
} & Omit<React.ComponentProps<"input">, "id" | "value" | "onChange" | "className">) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <>
            <RequiredMark />
            <span className="sr-only">(required)</span>
          </>
        )}
      </Label>
      <Input
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        readOnly={readOnly}
        className={cn(field, readOnly && readOnlyField)}
        {...rest}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={errorText}>
          {error}
        </p>
      )}
    </div>
  );
}

/* A country or a state: a field that only takes a name from its list.
   Typing narrows the list, best match first ("ind" → India, Indonesia),
   and Enter or a click takes one; clicking the empty field shows it all.
   Text that was typed but not picked is not an answer: on leaving, the
   field goes back to the last choice. The chosen name is submitted by the
   hidden input Base UI renders for `name`.

   The matching is ours (lib/countries.ts), so the list is whatever
   `suggest` returns for what is typed: everything while the field still
   shows the current choice. The popup borrows the account menu's surface
   so the site's popups read as one family.

   Read-only, it is a plain field like its neighbours: a list that opens
   and then refuses every choice would only mislead. */
export function PlaceField({
  id,
  label,
  required,
  error,
  value,
  onChange,
  options,
  suggest,
  noun,
  placeholder,
  disabled,
  readOnly,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  suggest: (query: string) => string[];
  /** What the list holds, for the "nothing found" line: "country". */
  noun: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const [query, setQuery] = React.useState(value);
  const matches = React.useMemo(
    () => (query === value ? [...options] : suggest(query)),
    [query, value, options, suggest],
  );
  if (readOnly) {
    return <TextField id={id} label={label} required={required} value={value} onChange={() => {}} readOnly />;
  }
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label}
        {required && (
          <>
            <RequiredMark />
            <span className="sr-only">(required)</span>
          </>
        )}
      </Label>
      <Combobox.Root
        name={id}
        items={options}
        filteredItems={matches}
        value={value || null}
        onValueChange={(next: string | null) => onChange(next ?? "")}
        onInputValueChange={setQuery}
        disabled={disabled}
        autoHighlight
      >
        <div className="relative">
          <Combobox.Input
            id={id}
            // The browser's own address suggestions would open over ours.
            autoComplete="off"
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            render={<Input className={cn(field, "pr-10")} />}
          />
          <CaretDownIcon
            className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            weight="bold"
            aria-hidden
          />
        </div>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={6} collisionPadding={16} className="z-50">
            <Combobox.Popup
              className={cn(
                "w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) p-1.5",
                // Outer radius 12px = the items' 8px + 4px of padding.
                "rounded-xl border border-transparent bg-popover text-popover-foreground",
                "shadow-[0_0_0_1px_--alpha(var(--color-black)/6%),0_1px_2px_-1px_--alpha(var(--color-black)/6%),0_8px_24px_-8px_--alpha(var(--color-black)/12%)]",
                "transition-[opacity,scale] duration-200 ease-out",
                "data-starting-style:scale-95 data-starting-style:opacity-0",
                "data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-150",
                "motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100",
              )}
            >
              <Combobox.Empty>
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No {noun} matches “{query.trim()}”.
                </p>
              </Combobox.Empty>
              <Combobox.List className="max-h-[min(18rem,var(--available-height))] overflow-y-auto overscroll-contain">
                {(option: string) => (
                  <Combobox.Item
                    key={option}
                    value={option}
                    className="flex cursor-default items-center rounded-lg px-3 py-2 text-sm text-foreground select-none data-highlighted:bg-muted data-selected:font-medium"
                  >
                    {option}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      {error && (
        <p id={`${id}-error`} className={errorText}>
          {error}
        </p>
      )}
    </div>
  );
}
