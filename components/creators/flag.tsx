import { cn } from "@/lib/utils";

/* A country's flag, by its ISO 3166-1 code (countryCode in
   lib/countries.ts). The drawings are the 3:2 set of country-flag-icons
   (MIT), copied into public/flags so nothing is asked of another host.
   Decorative: the country's name is always printed near it. A hairline
   keeps a flag with a white edge from running into a pale ground. */
export function Flag({ code, className }: { code: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code}.svg`}
      alt=""
      width={30}
      height={20}
      decoding="async"
      // A code with no drawing leaves nothing rather than a broken picture.
      onError={(event) => {
        event.currentTarget.hidden = true;
      }}
      className={cn(
        "h-5 w-[1.875rem] rounded-[0.1875rem] object-cover shadow-[0_0_0_1px_rgb(18_34_42/0.2),0_1px_2px_rgb(18_34_42/0.25)]",
        className,
      )}
    />
  );
}
