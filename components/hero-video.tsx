"use client";

/* The hero's looping film, the way sites with a film behind the headline
   usually do it: muted, inline, looped, no controls, and a still of its
   first frame underneath (in hero.tsx) until it plays, so the start is
   seamless.

   The markup carries no `autoplay`: the film starts from here once the page
   is live, and not at all for a visitor who asked for data saving, who
   keeps the still. It plays for everyone else, reduced motion included:
   the film is the site's first impression, by the owner's decision. It pauses while the hero is scrolled out
   of view, which saves battery and data, and picks up again on the way
   back. A browser may refuse to play (iOS in Low Power Mode does); the
   still stays. */
function attach(video: HTMLVideoElement) {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    ?.saveData;
  if (saveData) return;

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) video.play().catch(() => {});
    else video.pause();
  });
  observer.observe(video);
  return () => observer.disconnect();
}

export function HeroVideo({ className }: { className?: string }) {
  return (
    <video
      ref={attach}
      aria-hidden
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      disableRemotePlayback
      className={className}
    >
      {/* AV1 where the device can decode it, H.264 everywhere else. */}
      <source src="/videos/hero-av1.mp4" type='video/mp4; codecs="av01.0.08M.08"' />
      <source src="/videos/hero-h264.mp4" type="video/mp4" />
    </video>
  );
}
