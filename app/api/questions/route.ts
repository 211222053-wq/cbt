import { and, desc, eq, like } from "drizzle-orm";
import { ulid } from "ulid";

import { db } from "@/db/client";
import { questionOptions, questions } from "@/db/schema";
import { fail, ok } from "@/lib/api-response";
import { getAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { questionSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await getAuth();
  if (!auth) return fail("Unauthorized", 401);

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const subjectId = url.searchParams.get("subjectId")?.trim();

  const filters = [q ? like(questions.prompt, `%${q}%`) : undefined, subjectId ? eq(questions.subjectId, subjectId) : undefined].filter(Boolean);
  const where = filters.length ? and(...(filters as NonNullable<typeof filters[number]>[])) : undefined;

  const rows = await db
    .select({ id: questions.id, type: questions.type, prompt: questions.prompt, difficulty: questions.difficulty, createdAt: questions.createdAt })
    .from(questions)
    .where(where)
    .orderBy(desc(questions.createdAt))
    .limit(100);

  return ok({ items: rows });
}

export async function POST(request: Request) {
  const auth = await getAuth();
  if (!auth || !hasPermission(auth.roles, "questions:write")) return fail("Forbidden", 403);

  const body = await request.json();
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) return fail("Validasi gagal", 400, parsed.error.flatten());

  const qId = ulid();
  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx.insert(questions).values({
      id: qId,
      subjectId: parsed.data.subjectId,
      classId: parsed.data.classId ?? null,
      authorId: auth.user.id,
      type: parsed.data.type,
      stimulus: parsed.data.stimulus ?? null,
      prompt: parsed.data.prompt,
      answerKey: parsed.data.answerKey,
      explanation: parsed.data.explanation ?? null,
      weight: parsed.data.weight,
      difficulty: parsed.data.difficulty,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    if (parsed.data.options.length) {
      await tx.insert(questionOptions).values(
        parsed.data.options.map((o) => ({
          id: ulid(),
          questionId: qId,
          optionKey: o.optionKey,
          content: o.content,
          isCorrect: o.isCorrect,
          createdAt: now,
        })),
      );
    }
  });

  return ok({ id: qId });
}
