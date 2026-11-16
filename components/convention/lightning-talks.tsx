"use client";

import { YoutubeLogoIcon } from "@phosphor-icons/react";
import { COMMUNITY_DAYS } from "@/lib/convention-2026";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";

const { sessions, rooms } = COMMUNITY_DAYS.lightningTalks;

/* Only some talks were recorded, so the video link is optional. */
type Talk = { creator: string; topic: string; language: string; videoHref?: string };

/* The four rooms as tabs, one room's schedule at a time: 27 rows at once
   would bury the rest of the programme. Every panel stays mounted, so all
   27 names are in the HTML for search and find-in-page, not only the
   room that is open. */
export function LightningTalks() {
  return (
    <Tabs defaultValue={rooms[0].name} className="mt-5">
      <TabsList aria-label="Rooms">
        {rooms.map(({ name }) => (
          <TabsTab key={name} value={name}>
            {name}
          </TabsTab>
        ))}
      </TabsList>

      {rooms.map(({ name, talks }) => (
        <TabsPanel key={name} value={name} keepMounted className="mt-6">
          <h5 className="sr-only">{name} room</h5>
          <div className="flex flex-col gap-8">
            {sessions.map(({ label, time }, index) => (
              <section key={label} aria-labelledby={`${slug(name)}-${slug(label)}`}>
                <div className="flex items-baseline gap-3">
                  <h6
                    id={`${slug(name)}-${slug(label)}`}
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-cyan"
                  >
                    {label}
                  </h6>
                  <p className="text-sm tabular-nums text-muted-foreground">{time}</p>
                </div>

                {/* One row per talk: name leads, topic fills, language
                    trails. Rows divide with rules like the keynote list,
                    since a table's rows are structure, not decoration. */}
                <ul className="mt-2 flex flex-col">
                  {talks[index].map(({ creator, topic, language, videoHref }: Talk) => (
                    <li
                      key={creator}
                      className="grid gap-x-6 gap-y-1 border-b border-border py-3.5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] sm:items-baseline"
                    >
                      <p className="font-medium text-foreground">{creator}</p>
                      <div>
                        <p className="text-pretty text-sm leading-[1.5] text-muted-foreground">
                          {topic}
                        </p>
                        {videoHref && (
                          <a
                            href={videoHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-brand-cyan underline decoration-foreground/30 decoration-1 underline-offset-[5px] transition-[text-decoration-color] duration-150 ease-hover hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                          >
                            <YoutubeLogoIcon aria-hidden weight="bold" className="size-4" />
                            Watch the talk
                            <span className="sr-only">by {creator} (YouTube, opens in new tab)</span>
                          </a>
                        )}
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-end">
                        {language}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </TabsPanel>
      ))}
    </Tabs>
  );
}

function slug(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-");
}
