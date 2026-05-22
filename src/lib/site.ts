export const siteName = "NexTrack";
export const siteDescription = "Track anime, movies, and TV series with progress, favorites, reviews, and a clean personal dashboard.";

export function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}
