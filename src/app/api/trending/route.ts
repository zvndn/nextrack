import { getTrendingMedia } from "@/lib/media-sources";

export async function GET() {
  try {
    const data = await getTrendingMedia();
    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to load trending items." }, { status: 500 });
  }
}
