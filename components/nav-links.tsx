"use client";

import * as React from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { NavigationMenu } from "@base-ui/react/navigation-menu";
import { ArrowUpRightIcon, CaretDownIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/navigation";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const pill = cn(
  "relative inline-flex h-9 select-none items-center gap-1 rounded-full px-3.5 text-sm font-medium",
  // Hover is seen tens of times a day: a near-imperceptible color change only.
  "text-muted-foreground transition-[color,background-color,transform] duration-150 ease-hover",
  "hover:bg-muted hover:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground",
  // Press feedback: the interface heard the tap.
  "active:scale-[0.97]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

function ActiveDot({ active }: { active: boolean }) {
  // Golden dot marks the current section. Static; it never animates.
  return (
    <span
      aria-hidden
      className={cn(
        "absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand-golden transition-opacity duration-150 ease-hover",
        active ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

export function NavLinks() {
  const pathname = usePathname();
  const [value, setValue] = React.useState<NavigationMenu.Root.Value>(null);

  // Close the open submenu once navigation lands on the new route. Derived
  // during render rather than in an effect, so there is no extra render pass.
  const [lastPathname, setLastPathname] = React.useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setValue(null);
  }

  return (
    <NavigationMenu.Root
      aria-label="Primary"
      value={value}
      onValueChange={setValue}
    >
      <NavigationMenu.List className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);

          if (!item.children) {
            return (
              <NavigationMenu.Item key={item.href}>
                <NavigationMenu.Link
                  render={<NextLink href={item.href} />}
                  aria-current={active ? "page" : undefined}
                  className={cn(pill, active && "text-foreground")}
                >
                  {item.label}
                  <ActiveDot active={active} />
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            );
          }

          return (
            <NavigationMenu.Item key={item.href}>
              <NavigationMenu.Trigger
                className={cn(pill, "pe-2.5", active && "text-foreground")}
              >
                {item.label}
                <NavigationMenu.Icon className="transition-transform duration-150 ease-hover data-popup-open:rotate-180">
                  <CaretDownIcon className="size-4" weight="bold" />
                </NavigationMenu.Icon>
                <ActiveDot active={active} />
              </NavigationMenu.Trigger>

              <NavigationMenu.Content className="w-72 p-1.5">
                <ul className="flex flex-col">
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <NavigationMenu.Link
                        render={
                          child.external ? (
                            <a
                              href={child.href}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          ) : (
                            <NextLink href={child.href} />
                          )
                        }
                        aria-current={
                          !child.external && isActive(pathname, child.href)
                            ? "page"
                            : undefined
                        }
                        className={cn(
                          "flex flex-col gap-0.5 rounded-lg px-3 py-2.5 text-sm",
                          "transition-[background-color] duration-150 ease-hover hover:bg-muted",
                          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                        )}
                      >
                        <span className="flex items-center justify-between gap-2 font-medium text-foreground">
                          {child.label}
                          {child.external && (
                            <>
                              <ArrowUpRightIcon
                                aria-hidden
                                className="size-3.5 shrink-0 text-muted-foreground"
                                weight="bold"
                              />
                              <span className="sr-only">(opens in new tab)</span>
                            </>
                          )}
                        </span>
                        {child.description && (
                          <span className="text-pretty text-[13px] leading-[1.4] text-muted-foreground">
                            {child.description}
                          </span>
                        )}
                      </NavigationMenu.Link>
                    </li>
                  ))}
                </ul>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          );
        })}
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          sideOffset={8}
          collisionPadding={16}
          className="z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width)"
        >
          {/* Dropdown recipe: scales out of its trigger, 200ms ease-out,
              never from scale(0). Reduced motion keeps the fade only. */}
          <NavigationMenu.Popup
            className={cn(
              "relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin)",
              // Outer radius 12px = inner 8px + 4px padding (concentric with the links).
              "rounded-xl border border-transparent bg-popover text-popover-foreground outline-none",
              "shadow-[0_0_0_1px_--alpha(var(--color-black)/6%),0_1px_2px_-1px_--alpha(var(--color-black)/6%),0_8px_24px_-8px_--alpha(var(--color-black)/12%)]",
              "transition-[opacity,scale,width,height] duration-200 ease-out",
              "data-starting-style:scale-95 data-starting-style:opacity-0",
              "data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-150",
              "motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100",
            )}
          >
            <NavigationMenu.Viewport className="relative size-full overflow-hidden" />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}
