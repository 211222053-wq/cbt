"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="rounded-xl bg-white p-6">
      <h2 className="font-semibold">Terjadi kesalahan</h2>
      <p className="mt-2 text-sm text-slate-600">{error.message}</p>
      <button className="mt-4 rounded bg-[#1d4f8a] px-4 py-2 text-white" onClick={reset}>Coba lagi</button>
    </div>
  );
}
