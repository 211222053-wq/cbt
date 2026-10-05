# RyuExam CBT

RyuExam CBT adalah fondasi aplikasi Computer Based Test (CBT) production-ready untuk sekolah berbasis **Next.js App Router + TypeScript strict + Turso/libSQL + Drizzle ORM**.

## Stack
- Next.js (App Router), React, TypeScript (strict)
- Tailwind CSS
- Turso/libSQL + Drizzle ORM
- Zod validation
- bcrypt password hashing
- Sonner toast

## Fitur yang sudah diimplementasikan
- Landing page responsif (`/`) dengan palet RyuExam (#2563a8, #1d4f8a, #e8f0fa, #F4F3EF)
- Auth username/password + nomor peserta (untuk siswa), secure HttpOnly cookie session
- RBAC role: `SUPER_ADMIN`, `ADMIN`, `GURU`, `PROKTOR`, `SISWA`, `KEPALA_SEKOLAH`
- Schema database relasional lengkap (users/roles, siswa/guru, kelas/mapel, bank soal, ujian, session, jawaban, result, violations, audit logs, import/export, dll)
- API CRUD inti:
  - `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
  - `/api/students`, `/api/questions`, `/api/exams`
  - `/api/exams/[examId]/start|autosave|submit`
  - `/api/monitoring/violations`
  - `/api/reports/results?format=csv|xlsx`
- Engine ujian dasar:
  - Validasi jadwal + token aktif
  - Session ujian dengan expiry dari server
  - Randomisasi deterministik urutan soal/opsi per session
  - Autosave upsert (transactional)
  - Submit + auto scoring objektif (single choice, multi choice partial, true/false multi, matching, short answer), essay manual
- Anti-cheating event capture (tab switch/blur/copy/paste/right-click/shortcut) + penyimpanan pelanggaran
- Global `loading`, `error`, `not-found`, manifest PWA
- Smoke checks (`npm run test:smoke`) untuk scoring + deterministic order

## Struktur folder
- `app/` — route pages + API routes
- `components/` — shared components/providers
- `db/` — drizzle client + schema
- `drizzle/` — migration output
- `lib/` — auth, rbac, validation, scoring, utils
- `scripts/` — seed + smoke check

## Environment
Buat `.env.local` dari `.env.example`:

```bash
cp .env.example .env.local
```

Isi minimal:

```env
DATABASE_URL="libsql://<db>.turso.io"
DATABASE_AUTH_TOKEN="<token>"
SESSION_COOKIE_NAME="ryuexam_session"
SESSION_TTL_HOURS="12"
RATE_LIMIT_WINDOW_SEC="300"
RATE_LIMIT_MAX_ATTEMPTS="8"
```

## Setup & development
```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## Scripts
- `npm run dev` — jalankan dev server
- `npm run build` — production build
- `npm run lint` — linting
- `npm run typecheck` — TypeScript check
- `npm run db:generate` — generate migration dari schema
- `npm run db:migrate` — apply migration
- `npm run db:push` — push schema ke database
- `npm run db:seed` — seed akun/demo data
- `npm run test:smoke` — smoke checks utility inti

## Demo accounts (HANYA development)
> Semua password disimpan hashed (bcrypt) di DB.

- SUPER_ADMIN: `superadmin` / `SuperAdmin123!`
- ADMIN: `admin` / `Admin123!`
- GURU: `guru` / `Guru123!`
- PROKTOR: `proktor` / `Proktor123!`
- KEPALA_SEKOLAH: `kepsek` / `Kepsek123!`
- SISWA: `siswa` / `Siswa123!` (nomor peserta: `PST001`, token ujian demo: `RYU123`)

## Deploy Vercel
1. Set environment variables di Vercel project settings
2. Build command: `npm run build`
3. Optional post-deploy DB step: jalankan `npm run db:push` dari CI/admin environment

## Security notes
- Session disimpan di cookie HttpOnly + SameSite=Lax
- Rate limit login dasar untuk brute-force mitigation (best effort di environment serverless)
- Validasi request server-side memakai Zod
- Audit log untuk aksi sensitif login/create
- Anti-cheating browser bersifat **best-effort**, keterbatasan browser tidak menjamin pencegahan 100%

## Troubleshooting
- `DATABASE_URL missing`: pastikan `.env.local` valid
- Build gagal type mismatch: jalankan `npm run typecheck`
- DB belum siap: jalankan `npm run db:push` dan `npm run db:seed`
