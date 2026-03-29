import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { sessions, users, type UserRole } from "@/db/schema";
import { auth } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export async function getCurrentUserFromServer(): Promise<CurrentUser | null> {
  const requestHeaders = await headers();
  const authSession = (await auth.api.getSession({
    headers: requestHeaders,
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
