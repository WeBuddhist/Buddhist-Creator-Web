import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

export type PartnerLogo = {
  name: string;
  logo: StaticImageData;
  /** Null when the organisation has no site to link to. */
  href: string | null;
};

/* Logo wall shared by the Get Involved page and the homepage. Equal cells so
   square marks and wide wordmarks read as one set. Each logo is capped in
   height and width and centred, in a muted frame with the card hairline.
   Names stay in the DOM for screen readers and as the link's name. */
export function PartnerLogos({
  partners,
  className,
}: {
  partners: readonly PartnerLogo[];
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4",
        className,
      )}
    >
      {partners.map(({ name, logo, href }) => {
        const cell =
          "flex h-24 items-center justify-center rounded-xl border border-transparent bg-muted/40 px-6 shadow-ring";
        // A height cap suits wide wordmarks; a narrow crest under the same
        // cap shrinks to a sliver, so it gets more height.
        const narrow = logo.width / logo.height < 1.3;
        const mark = (
          <>
            <Image
              src={logo}
              alt=""
              placeholder="blur"
              sizes="(min-width: 1024px) 14rem, (min-width: 640px) 30vw, 45vw"
              className={cn(
                "w-auto max-w-full object-contain mix-blend-multiply",
                narrow ? "max-h-16" : "max-h-12",
              )}
            />
            <span className="sr-only">{name}</span>
          </>
        );
        return (
          <li key={name}>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  cell,
                  "transition-[background-color] duration-150 ease-hover hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                )}
              >
                {mark}
                <span className="sr-only">(opens in new tab)</span>
              </a>
            ) : (
              <div className={cell}>{mark}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
