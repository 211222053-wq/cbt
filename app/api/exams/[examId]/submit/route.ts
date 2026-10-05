import { and, eq, inArray } from "drizzle-orm";
import { ulid } from "ulid";

import { db } from "@/db/client";
import { answerOptions, answers, examQuestions, examSessions, exams, questions, resultDetails, results } from "@/db/schema";
import { fail, ok } from "@/lib/api-response";
import { getAuth } from "@/lib/auth";
import { scoreObjectiveQuestion } from "@/lib/scoring";
import { submitSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const auth = await getAuth();
  if (!auth) return fail("Unauthorized", 401);

  const parsed = submitSchema.safeParse(await request.json());
  if (!parsed.success) return fail("Validasi gagal", 400, parsed.error.flatten());

  const [session] = await db
    .select({ id: examSessions.id, studentId: examSessions.studentId, startedAt: examSessions.startedAt, status: examSessions.status })
    .from(examSessions)
    .where(and(eq(examSessions.id, parsed.data.sessionId), eq(examSessions.examId, examId)))
    .limit(1);

  if (!session || session.status !== "ACTIVE") return fail("Sesi tidak valid", 400);

  const [exam] = await db.select({ id: exams.id, kkm: exams.kkm }).from(exams).where(eq(exams.id, examId)).limit(1);
  if (!exam) return fail("Ujian tidak ditemukan", 404);

  const examQs = await db
    .select({ questionId: examQuestions.questionId, weight: examQuestions.weight, type: questions.type, answerKey: questions.answerKey })
    .from(examQuestions)
    .innerJoin(questions, eq(examQuestions.questionId, questions.id))
    .where(eq(examQuestions.examId, examId));

  const sessionAnswers = await db.select({ id: answers.id, questionId: answers.questionId, answerText: answers.answerText }).from(answers).where(eq(answers.sessionId, session.id));
  const answerIds = sessionAnswers.map((a) => a.id);
  const selected = answerIds.length
    ? await db
        .select({ answerId: answerOptions.answerId, optionKey: answerOptions.optionKey })
        .from(answerOptions)
        .where(inArray(answerOptions.answerId, answerIds))
    : [];

  let totalScore = 0;
  let correct = 0;
  let wrong = 0;

  const now = new Date().toISOString();
  const resultId = ulid();

  await db.transaction(async (tx) => {
    for (const q of examQs) {
      const answer = sessionAnswers.find((a) => a.questionId === q.questionId);
      const optionValues = selected.filter((s) => s.answerId === answer?.id).map((s) => s.optionKey);

      const score = scoreObjectiveQuestion({
        type: q.type,
        answerKey: q.answerKey,
        answerText: answer?.answerText,
        selectedOptions: optionValues,
        weight: q.weight,
      });

      if (score === null) {
        await tx.insert(resultDetails).values({
          id: ulid(),
          resultId,
          questionId: q.questionId,
          isCorrect: null,
          score: 0,
          gradingStatus: "MANUAL",
          graderId: null,
          createdAt: now,
        });
        continue;
      }

      totalScore += score;
      const isCorrect = score >= q.weight;
      if (isCorrect) correct += 1;
      else if (answer || optionValues.length) wrong += 1;

      await tx.insert(resultDetails).values({
        id: ulid(),
        resultId,
        questionId: q.questionId,
        isCorrect,
        score,
        gradingStatus: "AUTO",
        graderId: null,
        createdAt: now,
      });
    }

    const maxScore = examQs.reduce((acc, q) => acc + q.weight, 0) || 1;
    const final = Number(((totalScore / maxScore) * 100).toFixed(2));

    await tx.insert(results).values({
      id: resultId,
      sessionId: session.id,
      studentId: session.studentId,
      examId,
      score: final,
      correctCount: correct,
      wrongCount: wrong,
      emptyCount: Math.max(0, examQs.length - correct - wrong),
      durationSeconds: Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)),
      passed: final >= exam.kkm,
      createdAt: now,
      updatedAt: now,
    });

    await tx.update(examSessions).set({ status: "SUBMITTED", submittedAt: now, updatedAt: now, lastActivityAt: now }).where(eq(examSessions.id, session.id));
  });

  const [result] = await db.select({ score: results.score }).from(results).where(eq(results.id, resultId)).limit(1);

  return ok({ resultId, score: result?.score ?? 0 });
}
