import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
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
  if (typeof body !== "object") {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const profileFieldsProvided =
    "name" in body ||
    "username" in body ||
    "bio" in body ||
    "image" in body ||
    "location" in body ||
    "website" in body;
  const automationFieldsProvided = "autoFavoriteOnComplete" in body;

  if (!profileFieldsProvided && !automationFieldsProvided) {
    return Response.json({ error: "No profile changes were provided." }, { status: 400 });
  }

  const data: {
    name?: string;
    username?: string;
    bio?: string | null;
    image?: string | null;
    location?: string | null;
    website?: string | null;
    autoFavoriteOnComplete?: boolean;
  } = {};

  if (profileFieldsProvided) {
    const name = String(body.name ?? "").trim();
    const username = String(body.username ?? "").trim().toLowerCase();
    const bio = String(body.bio ?? "").trim();
    const image = String(body.image ?? "").trim();
    const location = String(body.location ?? "").trim();
    const website = String(body.website ?? "").trim();

    if (!name || !username) {
      return Response.json({ error: "Name and username are required." }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: session.user.id }
      },
      select: { id: true }
    });

    if (existing) {
      return Response.json({ error: "That username is already taken." }, { status: 409 });
    }

    data.name = name;
    data.username = username;
    data.bio = bio || null;
    data.image = image || null;
    data.location = location || null;
    data.website = website || null;
  }

  if (automationFieldsProvided) {
    data.autoFavoriteOnComplete = Boolean(body.autoFavoriteOnComplete);
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      image: true,
      location: true,
      website: true,
      autoFavoriteOnComplete: true
    }
  });

  return Response.json({ user });
}
