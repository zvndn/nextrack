import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexTrack",
  description: "Modern media tracking for anime, movies, and TV series."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
