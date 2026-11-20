"use client";

import { useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { DownloadSimpleIcon, ExportIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { CARD_PATH, CARD_SHARE } from "@/lib/creator-card";
import { cn } from "@/lib/utils";

/* Sharing a creator's own card: a picture of it to post, drawn on the
   server (lib/card-share.tsx), in the shape of a story or of a post.

   It opens in a drawer: a panel from the right on a wide screen, a sheet
   from the foot of the screen on a phone, where the thumb is. The drawer
   shows the picture before anything leaves the page. Where the
   browser can hand a file to the phone's share sheet (Instagram, WhatsApp
   and the rest are there on a phone), the main button does that; the
   picture can always be saved, which on a computer is the only way. The
   file is fetched as soon as the drawer opens, so the share sheet opens in
   the same tap: a browser only lets a page open it straight from a tap. */

const FORMATS = [
  { value: "story", label: "Story", ratio: "9:16", box: "aspect-[9/16]" },
  { value: "post", label: "Post", ratio: "4:5", box: "aspect-[4/5]" },
] as const;
type Format = (typeof FORMATS)[number]["value"];

const fileName = (format: Format) => `buddhist-creators-card-${format}.png`;
const pictureUrl = (format: Format, version: string) =>
  `${CARD_PATH}/share/${format}?v=${encodeURIComponent(version)}`;

/* Wide enough for the panel from the right: 48rem, Tailwind's md. */
const WIDE = "(min-width: 48rem)";
function onWidthChange(change: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}
const useWide = () =>
  useSyncExternalStore(onWidthChange, () => window.matchMedia(WIDE).matches, () => true);

/** Whether this browser can hand an image file to the system's share sheet. */
function canShareFiles() {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files: [new File([""], "card.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}

export function ShareCard({ version, className }: { version: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("story");
  // The src that has finished loading, so a new shape shows its placeholder.
  const [shown, setShown] = useState<string | null>(null);
  const url = pictureUrl(format, version);
  const wide = useWide();

  // The same URL the preview loads, so the browser's cache serves it.
  const picture = useQuery({
    queryKey: ["card-share", format, version],
    queryFn: async ({ signal }) => {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`The picture could not be drawn (${response.status})`);
      return new File([await response.blob()], fileName(format), { type: "image/png" });
    },
    enabled: open,
    staleTime: Infinity,
    retry: 1,
  });
  const shareable = open && canShareFiles();

  async function share() {
    if (!picture.data) return;
    try {
      await navigator.share({ files: [picture.data], title: CARD_SHARE.shareTitle });
    } catch (error) {
      // Closing the share sheet is not a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast(CARD_SHARE.shareFailed);
    }
  }

  const current = FORMATS.find((item) => item.value === format)!;

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection={wide ? "right" : "down"}>
      <DrawerTrigger render={<Button size="pill" className={className} />}>
        <ExportIcon data-icon="inline-start" weight="bold" />
        {CARD_SHARE.open}
      </DrawerTrigger>
      <DrawerContent data-face="inter" side={wide ? "right" : "bottom"}>
        <DrawerHeader className={wide ? undefined : "pt-2"}>
          <DrawerTitle className="text-lg">{CARD_SHARE.title}</DrawerTitle>
          <DrawerDescription>{CARD_SHARE.description}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="flex flex-col gap-4 px-5 pb-5">
          <RadioGroup
            value={format}
            onValueChange={(value) => setFormat(value as Format)}
            aria-label={CARD_SHARE.shape}
            className="grid w-full shrink-0 grid-cols-2 gap-1 rounded-full bg-muted p-1"
          >
            {FORMATS.map((item) => (
              <Radio.Root
                key={item.value}
                value={item.value}
                className={cn(
                  "flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground",
                  "transition-[background-color,color,box-shadow] duration-150 ease-out",
                  "hover:text-foreground data-checked:bg-card data-checked:text-foreground data-checked:shadow-border",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                )}
              >
                {item.label}
                <span className="text-xs font-normal text-muted-foreground tabular-nums">{item.ratio}</span>
              </Radio.Root>
            ))}
          </RadioGroup>

          {/* The stage the picture stands on: the panel's remaining height
              beside a wide screen, a fixed share of a phone's. The picture
              keeps its own shape inside it, whichever is chosen. */}
          <div
            className={cn(
              "relative shrink-0 overflow-hidden rounded-xl bg-brand-cyan/[0.06]",
              wide ? "min-h-[20rem] flex-1" : "h-[min(54dvh,30rem)]",
            )}
          >
            {shown !== url && !picture.isError && (
              <p aria-live="polite" className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                {CARD_SHARE.drawing}
              </p>
            )}
            {picture.isError ? (
              <p role="alert" className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-foreground">
                {CARD_SHARE.failed}
              </p>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={CARD_SHARE.alt(current.label.toLowerCase())}
                width={1080}
                height={format === "story" ? 1920 : 1350}
                onLoad={() => setShown(url)}
                className={cn(
                  "absolute inset-0 m-auto h-auto max-h-[calc(100%-2rem)] w-auto max-w-[calc(100%-2rem)] rounded-lg",
                  "shadow-[0_12px_32px_-12px] shadow-black/35",
                  "transition-opacity duration-200 ease-out",
                  shown === url ? "opacity-100" : "opacity-0",
                )}
              />
            )}
          </div>
        </DrawerBody>
        <DrawerFooter className="bg-transparent">
          <Button
            size="pill"
            variant={shareable ? "outline" : "default"}
            nativeButton={false}
            render={<a href={url} download={fileName(format)} />}
            className="h-11 flex-1 md:flex-none"
          >
            <DownloadSimpleIcon data-icon="inline-start" weight="bold" />
            {CARD_SHARE.download}
          </Button>
          {shareable && (
            <Button size="pill" onClick={share} disabled={!picture.data} className="h-11 flex-1 md:flex-none">
              <ExportIcon data-icon="inline-start" weight="bold" />
              {CARD_SHARE.share}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
