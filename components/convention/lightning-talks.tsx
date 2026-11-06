"use client";

import { COMMUNITY_DAYS } from "@/lib/convention-2026";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";

const { sessions, rooms } = COMMUNITY_DAYS.lightningTalks;

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
                    className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground"
                  >
                    {label}
                  </h6>
                  <p className="text-sm tabular-nums text-muted-foreground">{time}</p>
                </div>

                {/* One row per talk: name leads, topic fills, language
                    trails. Rows divide with rules like the keynote list,
                    since a table's rows are structure, not decoration. */}
                <ul className="mt-2 flex flex-col">
                  {talks[index].map(({ creator, topic, language }) => (
                    <li
                      key={creator}
                      className="grid gap-x-6 gap-y-1 border-b border-border py-3.5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] sm:items-baseline"
                    >
                      <p className="font-semibold text-foreground">{creator}</p>
                      <p className="text-pretty text-sm leading-[1.5] text-muted-foreground">
                        {topic}
                      </p>
                      <p className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground sm:text-end">
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
