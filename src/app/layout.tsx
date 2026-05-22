import type { Metadata } from "next";
import "./globals.css";
import { getBaseUrl, siteDescription, siteName } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: ["anime tracker", "movie tracker", "tv tracker", "watchlist", "progress tracking", "reviews", "favorites"],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: "/",
    title: siteName,
    description: siteDescription,
    siteName
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
