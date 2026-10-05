"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: fd.get("identity"), password: fd.get("password") }),
    });
    const json = await res.json();
    setLoading(false);
    if (!json.success) {
      toast.error(json.message ?? "Login gagal");
      return;
    }
    toast.success("Login berhasil");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-6">
      <h1 className="text-xl font-semibold">Login RyuExam CBT</h1>
      <p className="mt-1 text-sm text-slate-600">Gunakan username atau nomor peserta + password.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input name="identity" placeholder="username / nomor peserta" required />
        <input name="password" type="password" placeholder="password" required />
        <button disabled={loading} className="w-full rounded bg-[#1d4f8a] px-4 py-2 text-white disabled:opacity-60" type="submit">
          {loading ? "Memproses..." : "Login"}
        </button>
      </form>
    </div>
  );
}
