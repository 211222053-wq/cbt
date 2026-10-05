import { and, eq, inArray } from "drizzle-orm";
import { ulid } from "ulid";

import { db } from "@/db/client";
import { exams, examQuestions, examSessions, questionOptions, students } from "@/db/schema";
import { fail, ok } from "@/lib/api-response";
import { getAuth } from "@/lib/auth";
import { examStartSchema } from "@/lib/validation";
import { shuffleDeterministic } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const auth = await getAuth();
  if (!auth) return fail("Unauthorized", 401);

  const body = await request.json();
  const parsed = examStartSchema.safeParse(body);
  if (!parsed.success) return fail("Validasi gagal", 400, parsed.error.flatten());

  const [student] = await db.select({ id: students.id, userId: students.userId }).from(students).where(eq(students.userId, auth.user.id)).limit(1);
  if (!student) return fail("Hanya siswa yang bisa memulai ujian", 403);

  const [exam] = await db.select({ id: exams.id, status: exams.status, tokenEnabled: exams.tokenEnabled, token: exams.token, tokenExpiresAt: exams.tokenExpiresAt, startsAt: exams.startsAt, endsAt: exams.endsAt, durationMinutes: exams.durationMinutes, randomQuestionOrder: exams.randomQuestionOrder, randomOptionOrder: exams.randomOptionOrder }).from(exams).where(eq(exams.id, examId)).limit(1);
  if (!exam) return fail("Ujian tidak ditemukan", 404);

  const now = new Date();
  if (new Date(exam.startsAt) > now || new Date(exam.endsAt) < now) return fail("Ujian tidak berada dalam jadwal aktif", 400);
  if (exam.tokenEnabled) {
    const token = parsed.data.token?.trim().toUpperCase() ?? "";
    if (!exam.token || token !== exam.token.trim().toUpperCase()) return fail("Token ujian tidak valid", 400);
    if (exam.tokenExpiresAt && new Date(exam.tokenExpiresAt) < now) return fail("Token ujian sudah kadaluarsa", 400);
  }

  const [existing] = await db.select({ id: examSessions.id, status: examSessions.status, expiresAt: examSessions.expiresAt }).from(examSessions).where(and(eq(examSessions.examId, examId), eq(examSessions.studentId, student.id))).limit(1);
  if (existing && existing.status === "ACTIVE") return ok({ sessionId: existing.id, resumed: true, expiresAt: existing.expiresAt });

  const examQs = await db.select({ questionId: examQuestions.questionId }).from(examQuestions).where(eq(examQuestions.examId, examId));
  if (!examQs.length) return fail("Ujian belum memiliki soal", 400);

  const qOrder = exam.randomQuestionOrder ? shuffleDeterministic(examQs.map((q) => q.questionId), `${examId}:${student.id}`) : examQs.map((q) => q.questionId);

  const optionPairs = qOrder.length
    ? await db
        .select({ questionId: questionOptions.questionId, optionKey: questionOptions.optionKey })
        .from(questionOptions)
        .where(inArray(questionOptions.questionId, qOrder))
    : [];

  const optionOrder: Record<string, string[]> = {};
  for (const qid of qOrder) {
    const ops = optionPairs.filter((o) => o.questionId === qid).map((o) => o.optionKey);
    optionOrder[qid] = exam.randomOptionOrder ? shuffleDeterministic(ops, `${qid}:${student.id}`) : ops;
  }

  const startedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + exam.durationMinutes * 60 * 1000).toISOString();
  const sessionId = ulid();

  await db.insert(examSessions).values({
    id: sessionId,
    examId,
    studentId: student.id,
    startedAt,
    expiresAt,
    status: "ACTIVE",
    questionOrderJson: JSON.stringify(qOrder),
    optionOrderJson: JSON.stringify(optionOrder),
    lastActivityAt: startedAt,
    violationCount: 0,
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
    createdAt: startedAt,
    updatedAt: startedAt,
  });

  return ok({ sessionId, resumed: false, expiresAt });
}
