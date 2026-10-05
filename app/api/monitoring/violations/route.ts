import { and, eq } from "drizzle-orm";
import { ulid } from "ulid";

import { db } from "@/db/client";
import { examSessions, violations } from "@/db/schema";
import { fail, ok } from "@/lib/api-response";
import { getAuth } from "@/lib/auth";
import { violationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await getAuth();
  if (!auth) return fail("Unauthorized", 401);

  const parsed = violationSchema.safeParse(await request.json());
  if (!parsed.success) return fail("Validasi gagal", 400, parsed.error.flatten());

  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx.insert(violations).values({
      id: ulid(),
      sessionId: parsed.data.sessionId,
      studentId: auth.user.id,
      examId: parsed.data.examId,
      type: parsed.data.type,
      metadataJson: JSON.stringify(parsed.data.metadata),
      createdAt: now,
    });

    const [sess] = await tx
      .select({ id: examSessions.id, violationCount: examSessions.violationCount })
      .from(examSessions)
      .where(and(eq(examSessions.id, parsed.data.sessionId), eq(examSessions.examId, parsed.data.examId)))
      .limit(1);

    if (sess) {
      await tx.update(examSessions).set({ violationCount: sess.violationCount + 1, lastActivityAt: now, updatedAt: now }).where(eq(examSessions.id, sess.id));
    }
  });

  return ok({ logged: true });
}
