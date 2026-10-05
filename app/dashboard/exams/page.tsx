import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { exams, subjects } from "@/db/schema";

export default async function ExamsPage() {
  const rows = await db
    .select({ id: exams.id, code: exams.code, title: exams.title, status: exams.status, startsAt: exams.startsAt, endsAt: exams.endsAt, subject: subjects.name })
    .from(exams)
    .innerJoin(subjects, eq(exams.subjectId, subjects.id))
    .orderBy(desc(exams.createdAt))
    .limit(50);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manajemen Ujian</h1>
      <div className="space-y-3">
        {rows.map((e) => (
          <article key={e.id} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{e.code} • {e.subject} • {e.status}</p>
            <h2 className="font-semibold">{e.title}</h2>
            <p className="text-sm">{new Date(e.startsAt).toLocaleString("id-ID")} - {new Date(e.endsAt).toLocaleString("id-ID")}</p>
            <Link className="mt-2 inline-block text-sm text-[#1d4f8a] underline" href={`/exam/${e.id}`}>Buka Halaman Ujian Siswa</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
