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

  if (!body) {
    return Response.json({ error: "Request body is required." }, { status: 400 });
  }

  const mediaId = String(body.mediaId ?? "");
  const rating = Number(body.rating ?? 0);
  const reviewBody = String(body.body ?? "").trim();

  if (!mediaId || rating < 1 || rating > 10) {
    return Response.json({ error: "mediaId and a rating from 1 to 10 are required." }, { status: 400 });
  }

  const review = await prisma.review.create({
    data: { userId: session.user.id, mediaId, rating, body: reviewBody || null }
  });

  return Response.json({ review }, { status: 201 });
}
