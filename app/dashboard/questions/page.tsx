import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { questions, subjects } from "@/db/schema";

export default async function QuestionsPage() {
  const rows = await db
    .select({ id: questions.id, type: questions.type, prompt: questions.prompt, difficulty: questions.difficulty, subject: subjects.name })
    .from(questions)
    .innerJoin(subjects, eq(questions.subjectId, subjects.id))
    .orderBy(desc(questions.createdAt))
    .limit(50);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bank Soal</h1>
      <div className="grid gap-3">
        {rows.map((q) => (
          <article key={q.id} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{q.subject} • {q.type} • {q.difficulty}</p>
            <p className="mt-2 text-sm">{q.prompt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
