import { eq } from "drizzle-orm";
import { ulid } from "ulid";

import { db } from "@/db/client";
import {
  academicYears,
  classes,
  examQuestions,
  examParticipants,
  exams,
  permissions,
  questionOptions,
  questions,
  roles,
  schools,
  students,
  subjects,
  teachers,
  userRoles,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/password";

async function ensureRole(name: string) {
  const found = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, name)).limit(1);
  if (found[0]) return found[0].id;
  const id = ulid();
  await db.insert(roles).values({ id, name, description: name, createdAt: new Date().toISOString() });
  return id;
}

async function ensurePermission(code: string) {
  const found = await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.code, code)).limit(1);
  if (found[0]) return found[0].id;
  const id = ulid();
  await db.insert(permissions).values({ id, code, description: code, createdAt: new Date().toISOString() });
  return id;
}

async function createUser(params: { username: string; fullName: string; role: string; participantNumber?: string; password: string; schoolId: string }) {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, params.username)).limit(1);
  if (existing[0]) return existing[0].id;

  const userId = ulid();
  const roleId = await ensureRole(params.role);
  const now = new Date().toISOString();

  await db.insert(users).values({
    id: userId,
    schoolId: params.schoolId,
    username: params.username,
    fullName: params.fullName,
    participantNumber: params.participantNumber ?? null,
    passwordHash: await hashPassword(params.password),
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(userRoles).values({ id: ulid(), userId, roleId, createdAt: now });
  return userId;
}

async function main() {
  const now = new Date().toISOString();
  const [schoolExists] = await db.select({ id: schools.id }).from(schools).limit(1);
  const schoolId = schoolExists?.id ?? ulid();

  if (!schoolExists) {
    await db.insert(schools).values({
      id: schoolId,
      name: "SMK Ryu Nusantara",
      address: "Jl. Pendidikan No. 1",
      principalName: "Drs. Andi Pratama",
      themePrimary: "#2563a8",
      themeSecondary: "#1d4f8a",
      settingsJson: JSON.stringify({ timezone: "Asia/Jakarta" }),
      createdAt: now,
      updatedAt: now,
    });
  }

  const perms = [
    "dashboard:view","students:read","students:write","teachers:write","classes:write","subjects:write",
    "questions:write","exams:write","monitor:write","results:read","results:grade","settings:write",
  ];
  for (const p of perms) await ensurePermission(p);

  const superAdminId = await createUser({ username: "superadmin", fullName: "Super Admin", role: "SUPER_ADMIN", password: "SuperAdmin123!", schoolId });
  const adminId = await createUser({ username: "admin", fullName: "Admin Sekolah", role: "ADMIN", password: "Admin123!", schoolId });
  const guruId = await createUser({ username: "guru", fullName: "Ibu Guru", role: "GURU", password: "Guru123!", schoolId });
  const proktorId = await createUser({ username: "proktor", fullName: "Pak Proktor", role: "PROKTOR", password: "Proktor123!", schoolId });
  await createUser({ username: "kepsek", fullName: "Kepala Sekolah", role: "KEPALA_SEKOLAH", password: "Kepsek123!", schoolId });
  const siswaUserId = await createUser({ username: "siswa", fullName: "Siswa Demo", role: "SISWA", participantNumber: "PST001", password: "Siswa123!", schoolId });

  const classId = ulid();
  const classExisting = await db.select({ id: classes.id }).from(classes).where(eq(classes.name, "X-RPL-1")).limit(1);
  const classFinal = classExisting[0]?.id ?? classId;
  if (!classExisting[0]) {
    await db.insert(classes).values({ id: classFinal, schoolId, name: "X-RPL-1", gradeLevel: "10", homeroomTeacherId: guruId, active: true, createdAt: now, updatedAt: now });
  }

  const subjectExisting = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.code, "MTK")).limit(1);
  const subjectId = subjectExisting[0]?.id ?? ulid();
  if (!subjectExisting[0]) {
    await db.insert(subjects).values({ id: subjectId, code: "MTK", name: "Matematika", classLevel: "10", createdAt: now, updatedAt: now });
  }

  const ayExists = await db.select({ id: academicYears.id }).from(academicYears).where(eq(academicYears.label, "2026/2027")).limit(1);
  if (!ayExists[0]) {
    await db.insert(academicYears).values({ id: ulid(), label: "2026/2027", semester: "GANJIL", isActive: true, createdAt: now });
  }

  const studentExists = await db.select({ id: students.id }).from(students).where(eq(students.userId, siswaUserId)).limit(1);
  const studentId = studentExists[0]?.id ?? ulid();
  if (!studentExists[0]) {
    await db.insert(students).values({ id: studentId, userId: siswaUserId, nis: "1001", nisn: "0011223344", classId: classFinal, createdAt: now, updatedAt: now });
  }

  const teacherExists = await db.select({ id: teachers.id }).from(teachers).where(eq(teachers.userId, guruId)).limit(1);
  if (!teacherExists[0]) {
    await db.insert(teachers).values({ id: ulid(), userId: guruId, nip: "198001011", staffType: "GURU", createdAt: now, updatedAt: now });
  }

  const questionExists = await db.select({ id: questions.id }).from(questions).where(eq(questions.prompt, "2 + 2 = ... ?")).limit(1);
  const questionId = questionExists[0]?.id ?? ulid();
  if (!questionExists[0]) {
    await db.insert(questions).values({
      id: questionId,
      subjectId,
      classId: classFinal,
      authorId: guruId,
      type: "SINGLE_CHOICE",
      stimulus: "Operasi dasar",
      prompt: "2 + 2 = ... ?",
      answerKey: "B",
      explanation: "2 + 2 = 4",
      weight: 1,
      difficulty: "EASY",
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(questionOptions).values([
      { id: ulid(), questionId, optionKey: "A", content: "3", isCorrect: false, createdAt: now },
      { id: ulid(), questionId, optionKey: "B", content: "4", isCorrect: true, createdAt: now },
      { id: ulid(), questionId, optionKey: "C", content: "5", isCorrect: false, createdAt: now },
      { id: ulid(), questionId, optionKey: "D", content: "6", isCorrect: false, createdAt: now },
    ]);
  }

  const examExists = await db.select({ id: exams.id }).from(exams).where(eq(exams.code, "UTS10MTK")).limit(1);
  const examId = examExists[0]?.id ?? ulid();
  if (!examExists[0]) {
    const starts = new Date(Date.now() - 60_000).toISOString();
    const ends = new Date(Date.now() + 3_600_000).toISOString();
    await db.insert(exams).values({
      id: examId,
      code: "UTS10MTK",
      title: "UTS Matematika Kelas 10",
      subjectId,
      classId: classFinal,
      creatorId: guruId,
      status: "ACTIVE",
      tokenEnabled: true,
      token: "RYU123",
      tokenExpiresAt: ends,
      startsAt: starts,
      endsAt: ends,
      durationMinutes: 60,
      randomQuestionOrder: true,
      randomOptionOrder: true,
      kkm: 75,
      maxViolations: 5,
      autoSubmitOnViolation: true,
      showResult: true,
      showReview: true,
      allowNavigation: true,
      settingsJson: JSON.stringify({}),
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(examQuestions).values({ id: ulid(), examId, questionId, orderNo: 1, weight: 1, createdAt: now });
    await db.insert(examParticipants).values({ id: ulid(), examId, studentId, status: "ELIGIBLE", createdAt: now });
  }

  console.log("Seed selesai");
  console.table([
    { role: "SUPER_ADMIN", username: "superadmin", password: "SuperAdmin123!" },
    { role: "ADMIN", username: "admin", password: "Admin123!" },
    { role: "GURU", username: "guru", password: "Guru123!" },
    { role: "PROKTOR", username: "proktor", password: "Proktor123!" },
    { role: "KEPALA_SEKOLAH", username: "kepsek", password: "Kepsek123!" },
    { role: "SISWA", username: "siswa", participant: "PST001", password: "Siswa123!", tokenUjian: "RYU123" },
  ]);

  void superAdminId;
  void adminId;
  void proktorId;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
