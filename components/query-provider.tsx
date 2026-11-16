"use client";

import { QueryClient, QueryClientProvider, isServer } from "@tanstack/react-query";

/* React Query for the whole app. Client code that writes runs its server
   action (or its upload) as a mutation, which hands it the pending state,
   the result and the failure without an effect to watch for each.

   A mutation is tried once: a save that failed is the person's to send
   again, never the library's. And it is tried at once, online or not
   (networkMode "always"): by default the library holds a mutation made
   offline and sends it when the connection returns, which leaves a form
   saying "Saving…" with no word of why, and then saves it at a moment
   nobody chose.

   One client per browser tab, made on first use; the server makes a new
   one for every request so nothing is shared between visitors. */

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // Data read through a query is good for a minute before a refetch.
      queries: { staleTime: 60 * 1000 },
      mutations: { retry: false, networkMode: "always" },
    },
  });
}

let browserClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserClient ??= makeQueryClient();
  return browserClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
