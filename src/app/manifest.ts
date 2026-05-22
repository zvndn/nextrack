import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NexTrack",
    short_name: "NexTrack",
    description: "Track anime, movies, and TV series with watch progress and favorites.",
    start_url: "/",
    display: "standalone",
    background_color: "#080b12",
    theme_color: "#67e8f9",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon"
      }
    ]
  };
}
