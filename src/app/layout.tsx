import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { CookieShell } from "@/components/cookies/CookieShell";
import { organizationJsonLd, websiteJsonLd } from "@/lib/structured-data";
import { rootMetadata } from "@/lib/seo";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GH" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <CookieShell>{children}</CookieShell>
      </body>
    </html>
  );
}
