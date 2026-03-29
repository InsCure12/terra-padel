import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, users, type UserRole } from "@/db/schema";
import { auth } from "@/lib/auth";

type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export async function getCurrentUser(request: Request): Promise<CurrentUser | null> {
  const authSession = (await auth.api.getSession({
    headers: request.headers,
  })) as { session?: { token?: string } } | null;

  const token = authSession?.session?.token;
  if (!token) {
    return null;
  }

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .innerJoin(sessions, and(eq(sessions.userId, users.id), eq(sessions.token, token)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return user;
}

export async function requireUser(request: Request): Promise<CurrentUser | NextResponse> {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export async function requireManager(request: Request): Promise<CurrentUser | NextResponse> {
  const user = await requireUser(request);
  if (user instanceof NextResponse) {
    return user;
  }

  if (user.role !== "manager") {
    return NextResponse.json({ error: "Manager role required" }, { status: 403 });
  }

  return user;
}
