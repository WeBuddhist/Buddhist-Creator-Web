import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { SectionHeading, label } from "@/components/convention/section-heading";
import { JOIN } from "@/lib/home";

/* Router into the Get Involved page, set as an index: one ruled row per
   audience, the whole row a link to that audience's section. Who it is for
   leads in the small label, what they can do is the row's title, and the
   arrow at the end fills when the pointer arrives. */
export function Join() {
  return (
    <section aria-labelledby="join-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 pt-24 pb-24 sm:px-6 lg:pt-32 lg:pb-32">
        <SectionHeading
          id="join-title"
          eyebrow={JOIN.eyebrow}
          title={JOIN.title}
          description={JOIN.description}
        />

        <ul className="mt-12 border-t border-border lg:mt-16">
          {JOIN.audiences.map(({ id, eyebrow, title, href }) => (
            <li key={id} className="border-b border-border">
              <Link
                href={href}
                className="group/join grid items-center gap-x-8 gap-y-3 py-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:grid-cols-[14rem_minmax(0,1fr)_auto] lg:py-10"
              >
                <p className={cn(label, "text-brand-cyan")}>{eyebrow}</p>
                <h3 className="text-balance font-display text-3xl leading-[1.12] text-foreground transition-colors duration-150 ease-hover group-hover/join:text-brand-cyan lg:text-[2.5rem]">
                  {title}
                </h3>
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-full border border-ink/25 text-foreground transition-[background-color,border-color,color] duration-150 ease-hover group-hover/join:border-brand-cyan group-hover/join:bg-brand-cyan group-hover/join:text-white max-md:hidden"
                >
                  <ArrowRightIcon weight="bold" className="size-5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
