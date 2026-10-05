import Link from "next/link";
import { count } from "drizzle-orm";

import { db } from "@/db/client";
import { exams, questions, students } from "@/db/schema";
import { getAuth } from "@/lib/auth";

export default async function DashboardPage() {
  const auth = await getAuth();
  if (!auth) {
    return <div className="rounded-xl bg-white p-6">Silakan login terlebih dahulu.</div>;
  }

  const [studentCount] = await db.select({ value: count(students.id) }).from(students);
  const [questionCount] = await db.select({ value: count(questions.id) }).from(questions);
  const [examCount] = await db.select({ value: count(exams.id) }).from(exams);

  const stats = [
    { label: "Siswa", value: studentCount?.value ?? 0 },
    { label: "Soal", value: questionCount?.value ?? 0 },
    { label: "Ujian", value: examCount?.value ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard {auth.user.fullName}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/students" className="rounded-lg bg-white p-4 shadow-sm">Kelola Siswa</Link>
        <Link href="/dashboard/exams" className="rounded-lg bg-white p-4 shadow-sm">Kelola Ujian</Link>
      </div>
    </div>
  );
}
