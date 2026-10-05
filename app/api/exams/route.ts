import { desc, eq } from "drizzle-orm";
import { ulid } from "ulid";

import { db } from "@/db/client";
import { examParticipants, examQuestions, exams, students } from "@/db/schema";
import { fail, ok } from "@/lib/api-response";
import { getAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { examSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await getAuth();
  if (!auth) return fail("Unauthorized", 401);

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim();

  const rows = await db
    .select({ id: exams.id, code: exams.code, title: exams.title, classId: exams.classId, subjectId: exams.subjectId, status: exams.status, startsAt: exams.startsAt, endsAt: exams.endsAt })
    .from(exams)
    .where(status ? eq(exams.status, status) : undefined)
    .orderBy(desc(exams.createdAt))
    .limit(100);

  return ok({ items: rows });
}

export async function POST(request: Request) {
  const auth = await getAuth();
  if (!auth || !hasPermission(auth.roles, "exams:write")) return fail("Forbidden", 403);

  const body = await request.json();
  const parsed = examSchema.safeParse(body);
  if (!parsed.success) return fail("Validasi gagal", 400, parsed.error.flatten());

  if (new Date(parsed.data.endsAt) <= new Date(parsed.data.startsAt)) return fail("Waktu selesai harus lebih besar dari mulai", 400);

  const examId = ulid();
  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx.insert(exams).values({
      id: examId,
      code: parsed.data.code,
      title: parsed.data.title,
      subjectId: parsed.data.subjectId,
      classId: parsed.data.classId,
      creatorId: auth.user.id,
      status: parsed.data.status,
      tokenEnabled: parsed.data.tokenEnabled,
      token: parsed.data.tokenEnabled ? parsed.data.token ?? null : null,
      tokenExpiresAt: parsed.data.tokenEnabled ? parsed.data.tokenExpiresAt ?? null : null,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      durationMinutes: parsed.data.durationMinutes,
      randomQuestionOrder: parsed.data.randomQuestionOrder,
      randomOptionOrder: parsed.data.randomOptionOrder,
      kkm: parsed.data.kkm,
      maxViolations: parsed.data.maxViolations,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(examQuestions).values(parsed.data.questionIds.map((qid, idx) => ({
      id: ulid(),
      examId,
      questionId: qid,
      orderNo: idx + 1,
      weight: 1,
      createdAt: now,
    })));

    const participants = await tx.select({ id: students.id }).from(students).where(eq(students.classId, parsed.data.classId));
    if (participants.length) {
      await tx.insert(examParticipants).values(participants.map((p) => ({
        id: ulid(),
        examId,
        studentId: p.id,
        status: "ELIGIBLE",
        createdAt: now,
      })));
    }
  });

  return ok({ id: examId });
}
