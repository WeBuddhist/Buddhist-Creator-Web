import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
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
