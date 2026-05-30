import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function createShareId() {
  return randomBytes(9).toString("base64url");
}

async function createUniqueShareId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shareId = createShareId();
    const existing = await prisma.user.findUnique({
      where: { watchlistShareId: shareId },
      select: { id: true }
    });

    if (!existing) return shareId;
  }

  throw new Error("Could not create a unique share id.");
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Authentication required." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON input." }, { status: 400 });
  }

  const enabled = Boolean(body?.enabled);
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { watchlistShareId: true }
  });

  if (!currentUser) return Response.json({ error: "User not found." }, { status: 404 });

  const shareId = currentUser.watchlistShareId ?? await createUniqueShareId();
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      watchlistPublic: enabled,
      watchlistShareId: shareId
    },
    select: {
      watchlistPublic: true,
      watchlistShareId: true
    }
  });

  const shareUrl = `${new URL(request.url).origin}/watchlist/${user.watchlistShareId}`;
  return Response.json({
    enabled: user.watchlistPublic,
    shareId: user.watchlistShareId,
    shareUrl
  });
}
