import { desc, eq, like, or } from "drizzle-orm";
import { ulid } from "ulid";

import { db } from "@/db/client";
import { auditLogs, students, userRoles, users } from "@/db/schema";
import { fail, ok } from "@/lib/api-response";
import { getAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { hashPassword } from "@/lib/password";
import { studentCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await getAuth();
  if (!auth || !hasPermission(auth.roles, "students:read")) return fail("Forbidden", 403);

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const size = Math.min(Number(url.searchParams.get("size") ?? "20"), 100);
  const q = url.searchParams.get("q")?.trim();

  const where = q ? or(like(users.fullName, `%${q}%`), like(users.username, `%${q}%`), like(users.participantNumber, `%${q}%`)) : undefined;

  const rows = await db
    .select({ id: students.id, userId: users.id, fullName: users.fullName, username: users.username, participantNumber: users.participantNumber, nis: students.nis, nisn: students.nisn, classId: students.classId })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(where)
    .orderBy(desc(students.createdAt))
    .limit(size)
    .offset((Math.max(page, 1) - 1) * size);

  return ok({ items: rows, page, size });
}

export async function POST(request: Request) {
  const auth = await getAuth();
  if (!auth || !hasPermission(auth.roles, "students:write")) return fail("Forbidden", 403);

  const body = await request.json();
  const parsed = studentCreateSchema.safeParse(body);
  if (!parsed.success) return fail("Validasi gagal", 400, parsed.error.flatten());

  const now = new Date().toISOString();
  const userId = ulid();
  const studentId = ulid();
  const passHash = await hashPassword(parsed.data.password);

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      username: parsed.data.username,
      fullName: parsed.data.fullName,
      participantNumber: parsed.data.participantNumber,
      passwordHash: passHash,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(students).values({
      id: studentId,
      userId,
      nis: parsed.data.nis,
      nisn: parsed.data.nisn,
      classId: parsed.data.classId,
      createdAt: now,
      updatedAt: now,
    });

    const [studentRole] = await tx.select({ id: userRoles.roleId }).from(userRoles).limit(1);
    if (studentRole) {
      await tx.insert(userRoles).values({ id: ulid(), userId, roleId: studentRole.id, createdAt: now });
    }

    await tx.insert(auditLogs).values({
      id: ulid(),
      actorUserId: auth.user.id,
      action: "STUDENT_CREATE",
      targetType: "student",
      targetId: studentId,
      metadataJson: JSON.stringify({ username: parsed.data.username }),
      ipAddress: null,
      createdAt: now,
    });
  });

  return ok({ id: studentId });
}
