import { eq } from "drizzle-orm";
import { ulid } from "ulid";

import { db } from "@/db/client";
import { auditLogs, userRoles, users } from "@/db/schema";
import { fail, ok } from "@/lib/api-response";
import { createSession, loginWithCredential } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rate = checkRateLimit(`login:${ip}`);
  if (!rate.allowed) return fail("Terlalu banyak percobaan login", 429, { retryAfterSec: rate.retryAfterSec });

  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return fail("Validasi gagal", 400, parsed.error.flatten());

  const user = await loginWithCredential(parsed.data.identity, parsed.data.password);
  if (!user) return fail("Kredensial tidak valid", 401);

  await createSession(user.id);

  await db.insert(auditLogs).values({
    id: ulid(),
    actorUserId: user.id,
    action: "AUTH_LOGIN",
    targetType: "user",
    targetId: user.id,
    metadataJson: JSON.stringify({ identity: parsed.data.identity }),
    ipAddress: ip,
  });

  const roleRows = await db.select({ roleId: userRoles.roleId }).from(userRoles).where(eq(userRoles.userId, user.id));

  await db.update(users).set({ lastLoginAt: new Date().toISOString() }).where(eq(users.id, user.id));

  return ok({ userId: user.id, roleIds: roleRows.map((r) => r.roleId) });
}
