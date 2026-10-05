import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { db } from "@/db/client";
import { classes, exams, results, students, users } from "@/db/schema";
import { fail } from "@/lib/api-response";
import { getAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { toCsv } from "@/lib/utils";

export async function GET(request: Request) {
  const auth = await getAuth();
  if (!auth || !hasPermission(auth.roles, "results:read")) return fail("Forbidden", 403);

  const url = new URL(request.url);
  const examId = url.searchParams.get("examId");
  const format = (url.searchParams.get("format") ?? "csv").toLowerCase();

  const rows = await db
    .select({
      examCode: exams.code,
      examTitle: exams.title,
      className: classes.name,
      participantNumber: users.participantNumber,
      fullName: users.fullName,
      score: results.score,
      correct: results.correctCount,
      wrong: results.wrongCount,
      empty: results.emptyCount,
      passed: results.passed,
    })
    .from(results)
    .innerJoin(exams, eq(results.examId, exams.id))
    .innerJoin(students, eq(results.studentId, students.id))
    .innerJoin(users, eq(students.userId, users.id))
    .innerJoin(classes, eq(students.classId, classes.id))
    .where(examId ? eq(results.examId, examId) : undefined)
    .limit(5000);

  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=results.xlsx",
      },
    });
  }

  const csv = toCsv(rows.map((r) => ({ ...r, passed: r.passed ? "YES" : "NO" })));
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=results.csv",
    },
  });
}
