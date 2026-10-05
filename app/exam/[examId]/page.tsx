import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { exams, examSessions } from "@/db/schema";
import { getAuth } from "@/lib/auth";

import { ExamClient } from "./ui";

export default async function ExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const auth = await getAuth();
  if (!auth) {
    return <div className="rounded-xl bg-white p-6">Silakan login untuk memulai ujian.</div>;
  }

  const [exam] = await db.select({ id: exams.id, title: exams.title, code: exams.code, startsAt: exams.startsAt, endsAt: exams.endsAt, durationMinutes: exams.durationMinutes }).from(exams).where(eq(exams.id, examId)).limit(1);
  if (!exam) {
    return <div className="rounded-xl bg-white p-6">Ujian tidak ditemukan.</div>;
  }

  const [session] = await db
    .select({ id: examSessions.id, expiresAt: examSessions.expiresAt, status: examSessions.status })
    .from(examSessions)
    .where(and(eq(examSessions.examId, examId), eq(examSessions.status, "ACTIVE")))
    .limit(1);

  return <ExamClient exam={exam} activeSession={session ?? null} />;
}
