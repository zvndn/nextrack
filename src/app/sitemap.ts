import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/site";

const publicRoutes = [
  "",
  "/discover",
  "/anime",
  "/movies",
  "/tv",
  "/login",
  "/register",
  "/about",
  "/privacy",
  "/terms"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7
  }));
}
