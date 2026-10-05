import { and, eq } from "drizzle-orm";
import { ulid } from "ulid";

import { db } from "@/db/client";
import { answerOptions, answers, examSessions } from "@/db/schema";
import { fail, ok } from "@/lib/api-response";
import { getAuth } from "@/lib/auth";
import { autosaveSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const auth = await getAuth();
  if (!auth) return fail("Unauthorized", 401);

  const body = await request.json();
  const parsed = autosaveSchema.safeParse(body);
  if (!parsed.success) return fail("Validasi gagal", 400, parsed.error.flatten());

  const [session] = await db
    .select({ id: examSessions.id, status: examSessions.status, expiresAt: examSessions.expiresAt })
    .from(examSessions)
    .where(and(eq(examSessions.id, parsed.data.sessionId), eq(examSessions.examId, examId)))
    .limit(1);

  if (!session || session.status !== "ACTIVE") return fail("Sesi tidak aktif", 400);
  if (new Date(session.expiresAt) < new Date()) return fail("Waktu ujian habis", 400);

  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    for (const item of parsed.data.answers) {
      const [existing] = await tx
        .select({ id: answers.id })
        .from(answers)
        .where(and(eq(answers.sessionId, parsed.data.sessionId), eq(answers.questionId, item.questionId)))
        .limit(1);

      const answerId = existing?.id ?? ulid();
      if (existing) {
        await tx.update(answers).set({ answerText: item.answerText ?? null, marked: item.marked ?? false, answeredAt: now, updatedAt: now }).where(eq(answers.id, answerId));
      } else {
        await tx.insert(answers).values({
          id: answerId,
          sessionId: parsed.data.sessionId,
          questionId: item.questionId,
          answerText: item.answerText ?? null,
          marked: item.marked ?? false,
          answeredAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }

      await tx.delete(answerOptions).where(eq(answerOptions.answerId, answerId));
      if (item.selectedOptions?.length) {
        await tx.insert(answerOptions).values(item.selectedOptions.map((opt) => ({ id: ulid(), answerId, optionKey: opt, createdAt: now })));
      }
    }

    await tx.update(examSessions).set({ lastActivityAt: now, updatedAt: now }).where(eq(examSessions.id, parsed.data.sessionId));
  });

  return ok({ saved: parsed.data.answers.length });
}
