import Link from "next/link";

import { getAuth } from "@/lib/auth";

export async function AppNav() {
  const auth = await getAuth();
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-[#1d4f8a]">RyuExam CBT</Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/dashboard/students">Siswa</Link>
          <Link href="/dashboard/questions">Soal</Link>
          <Link href="/dashboard/exams">Ujian</Link>
          {auth ? <form action="/api/auth/logout" method="post"><button className="rounded bg-slate-800 px-3 py-1 text-white" type="submit">Logout</button></form> : <Link href="/login">Login</Link>}
        </nav>
      </div>
    </header>
  );
}
