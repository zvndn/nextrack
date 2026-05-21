import { prisma } from "@/lib/prisma";

function fallbackDurationSeconds(type: "ANIME" | "MOVIE" | "TV") {
  switch (type) {
    case "ANIME":
      return 20 * 60;
    case "MOVIE":
      return 150 * 60;
    case "TV":
    default:
      return 45 * 60;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;
  if (!mediaId) {
    return Response.json({ error: "mediaId required" }, { status: 400 });
  }

  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { type: true, duration: true }
  });
  if (!media) {
    return Response.json({ error: "Media not found" }, { status: 404 });
  }

  if (media.duration && media.duration > 0) {
    return Response.json({ duration: media.duration });
  }

  const duration = fallbackDurationSeconds(media.type);

  await prisma.media.update({
    where: { id: mediaId },
    data: { duration }
  });

  return Response.json({ duration });
}
