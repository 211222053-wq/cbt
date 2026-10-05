export type Permission =
  | "dashboard:view"
  | "students:read"
  | "students:write"
  | "teachers:write"
  | "classes:write"
  | "subjects:write"
  | "questions:write"
  | "exams:write"
  | "monitor:write"
  | "results:read"
  | "results:grade"
  | "settings:write";

const roleMap: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    "dashboard:view","students:read","students:write","teachers:write","classes:write","subjects:write",
    "questions:write","exams:write","monitor:write","results:read","results:grade","settings:write",
  ],
  ADMIN: ["dashboard:view","students:read","students:write","teachers:write","classes:write","subjects:write","questions:write","exams:write","monitor:write","results:read","settings:write"],
  GURU: ["dashboard:view","questions:write","exams:write","results:read","results:grade"],
  PROKTOR: ["dashboard:view","monitor:write","results:read"],
  SISWA: ["dashboard:view"],
  KEPALA_SEKOLAH: ["dashboard:view","results:read"],
};

export function hasPermission(roles: string[], permission: Permission) {
  return roles.some((role) => roleMap[role]?.includes(permission));
}
