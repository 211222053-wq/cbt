import { and, eq, lt, or } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { ulid } from "ulid";

import { db } from "@/db/client";
import { roles, sessions, userRoles, users } from "@/db/schema";
import { env } from "@/lib/env";
import { fail } from "@/lib/api-response";
import { verifyPassword } from "@/lib/password";

export async function loginWithCredential(identity: string, password: string) {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      participantNumber: users.participantNumber,
      passwordHash: users.passwordHash,
      status: users.status,
    })
    .from(users)
    .where(and(eq(users.status, "ACTIVE"), or(eq(users.username, identity), eq(users.participantNumber, identity))))
    .limit(1);

  if (!user) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;
  return user;
}

export async function createSession(userId: string) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);
  const id = ulid();
  const h = await headers();
  await db.insert(sessions).values({
    id,
    userId,
    expiresAt: expiresAt.toISOString(),
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  });
  const c = await cookies();
  c.set(env.SESSION_COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const c = await cookies();
  const token = c.get(env.SESSION_COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }
  c.delete(env.SESSION_COOKIE_NAME);
}

export async function getAuth() {
  const c = await cookies();
  const sessionId = c.get(env.SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  await db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString()));

  const [sess] = await db.select({ id: sessions.id, userId: sessions.userId, expiresAt: sessions.expiresAt }).from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!sess) return null;

  const [user] = await db.select({ id: users.id, username: users.username, fullName: users.fullName, status: users.status }).from(users).where(and(eq(users.id, sess.userId), eq(users.status, "ACTIVE"))).limit(1);
  if (!user) return null;

  const rs = await db
    .select({ role: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, user.id));

  return { user, roles: rs.map((r) => r.role) };
}

export async function requireAuth() {
  const auth = await getAuth();
  if (!auth) {
    throw fail("Unauthorized", 401);
  }
  return auth;
}
