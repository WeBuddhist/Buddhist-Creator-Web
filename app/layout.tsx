import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Sans, Inter, Newsreader } from "next/font/google";
import { Toaster } from "sonner";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/navigation";
import "./globals.css";

// The site's text face (`font-sans`): navigation, body copy, labels, forms.
const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

// The serif (`font-display`): the wordmark, page titles, section titles and
// quotations. The optical-size axis is loaded so a 20px card title and a
// 160px page title each get the cut drawn for their size; the italic marks
// the words in a title that matter most.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

// The admin dashboard's face. The dashboard keeps its own neutral look, see
// "Admin keeps the dashboard look" in globals.css. On the public site only
// the homepage hero's convention ticket is set in it, so it is not
// preloaded: no other page should pay for it.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pages set their own title and description; Open Graph and Twitter copy
// them. The card image is app/opengraph-image.tsx, which Next.js wires up.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
  // The paper the site is printed on, so the browser chrome matches it.
  themeColor: "#faf7f1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${newsreader.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* The header and footer belong to the (site) group's layout, so the
          sign-in page can stand alone on this shell. */}
      <body className="flex min-h-full flex-col">
        {children}
        {/* One toaster for the whole site. Pages call toast() from client
            code; the register page lifts it above its floating action bar
            through --action-bar-height, see globals.css. */}
        <Toaster
          position="bottom-center"
          theme="light"
          toastOptions={{ style: { fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif" } }}
        />
      </body>
    </html>
  );
}
