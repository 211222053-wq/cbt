import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { students, users } from "@/db/schema";

export default async function StudentsPage() {
  const rows = await db
    .select({ id: students.id, nis: students.nis, nisn: students.nisn, classId: students.classId, fullName: users.fullName, username: users.username, participantNumber: users.participantNumber })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .orderBy(desc(students.createdAt))
    .limit(50);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Data Siswa</h1>
      <div className="overflow-x-auto rounded-xl bg-white p-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Nama</th><th>Username</th><th>No Peserta</th><th>NIS</th><th>NISN</th><th>Kelas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="py-2">{s.fullName}</td><td>{s.username}</td><td>{s.participantNumber}</td><td>{s.nis}</td><td>{s.nisn}</td><td>{s.classId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
