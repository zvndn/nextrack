import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Authentication required." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON input." }, { status: 400 });
  }

  const mediaId = body?.mediaId;
  if (!mediaId) return Response.json({ error: "mediaId is required." }, { status: 400 });

  const favorite = await prisma.favorite.upsert({
    where: { userId_mediaId: { userId: session.user.id, mediaId } },
    update: {},
    create: { userId: session.user.id, mediaId }
  });

  return Response.json({ favorite }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Authentication required." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get("mediaId");
  if (!mediaId) return Response.json({ error: "mediaId is required." }, { status: 400 });

  await prisma.favorite.deleteMany({ where: { userId: session.user.id, mediaId } });
  return Response.json({ ok: true });
}
