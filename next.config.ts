import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  /* next/image serves each file as it is, with no resizing. Resizing runs
     inside the server process and ran the 512 MB instance out of memory.
     This also turns the /_next/image endpoint off (it answers 404), so
     nothing outside can ask the server to resize either. */
  images: {
    unoptimized: true,
  },
  /* The dev-tools badge defaults to the bottom-left corner, where it sits
     on top of the admin sidebar's account trigger. Nothing of ours lives
     bottom-right. Development only; production renders no badge. */
  devIndicators: {
    position: "bottom-right",
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
