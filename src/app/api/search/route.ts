import { searchMedia, type MediaSearchType } from "@/lib/media-sources";

const validTypes = new Set(["all", "anime", "movie", "tv"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const requestedType = searchParams.get("type") ?? "all";
  const type = validTypes.has(requestedType) ? (requestedType as MediaSearchType) : "all";

  if (query.trim().length < 2) {
    return Response.json({ results: [] });
  }

  try {
    const results = await searchMedia(query, type);
    return Response.json({ results });
  } catch {
    return Response.json({ error: "Search failed." }, { status: 500 });
  }
}
