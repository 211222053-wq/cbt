import Link from "next/link";

const features = [
  "Auth aman + RBAC granular",
  "Engine ujian dengan autosave dan randomisasi deterministik",
  "Monitoring pelanggaran anti-cheating",
  "Laporan nilai, analisis butir, export CSV/XLSX",
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-[#2563a8] to-[#1d4f8a] p-8 text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">RyuExam CBT</h1>
        <p className="mt-3 max-w-2xl text-sm sm:text-base">
          Platform ujian sekolah production-ready berbasis Next.js + Turso. Mendukung manajemen bank soal, ujian,
          monitoring proktor, dan laporan hasil pembelajaran.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-lg bg-white px-4 py-2 font-semibold text-[#1d4f8a]">Mulai Demo</Link>
          <Link href="/dashboard" className="rounded-lg border border-white/80 px-4 py-2">Dashboard</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <article key={f} className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="font-semibold">{f}</h2>
          </article>
        ))}
      </section>

      <section className="rounded-xl bg-[#F4F3EF] p-6">
        <h3 className="font-semibold">Cara Kerja Singkat</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm">
          <li>Admin setup data sekolah, kelas, mapel, siswa, guru.</li>
          <li>Guru membuat soal lalu menyusun ujian terjadwal dengan token opsional.</li>
          <li>Siswa login, mulai ujian, jawaban tersimpan otomatis sampai submit.</li>
          <li>Proktor memantau pelanggaran dan status peserta secara realtime polling.</li>
        </ol>
      </section>

      <section className="rounded-xl bg-white p-6">
        <h3 className="font-semibold">FAQ</h3>
        <p className="mt-2 text-sm">Browser anti-cheating bersifat best effort. Tidak ada mekanisme browser yang bisa 100% mencegah kecurangan.</p>
      </section>
    </div>
  );
}
