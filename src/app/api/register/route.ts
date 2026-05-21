import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON input." }, { status: 400 });
  }

  if (!body) {
    return Response.json({ error: "Request body is required." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const username = String(body.username ?? "").trim().toLowerCase();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!name || !username || !email || password.length < 8) {
    return Response.json(
      { error: "Name, username, email, and an 8 character password are required." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true }
  });

  if (existing) {
    return Response.json({ error: "An account with this email or username already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, username, email, passwordHash },
    select: { id: true, name: true, username: true, email: true }
  });

  return Response.json({ user }, { status: 201 });
}
