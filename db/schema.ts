import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const ts = () => text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`);
const uts = () => text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`);

export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: ts(),
});

export const permissions = sqliteTable("permissions", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  createdAt: ts(),
});

export const rolePermissions = sqliteTable("role_permissions", {
  id: text("id").primaryKey(),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: text("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: ts(),
}, (t) => [uniqueIndex("role_perm_uq").on(t.roleId, t.permissionId)]);

export const schools = sqliteTable("schools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  logoUrl: text("logo_url"),
  principalName: text("principal_name"),
  themePrimary: text("theme_primary").notNull().default("#2563a8"),
  themeSecondary: text("theme_secondary").notNull().default("#1d4f8a"),
  settingsJson: text("settings_json").notNull().default("{}"),
  createdAt: ts(),
  updatedAt: uts(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  participantNumber: text("participant_number"),
  passwordHash: text("password_hash").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  lastLoginAt: text("last_login_at"),
  createdAt: ts(),
  updatedAt: uts(),
}, (t) => [
  uniqueIndex("users_participant_uq").on(t.participantNumber),
  index("users_school_idx").on(t.schoolId),
]);

export const userRoles = sqliteTable("user_roles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  createdAt: ts(),
}, (t) => [uniqueIndex("user_role_uq").on(t.userId, t.roleId)]);

export const classes = sqliteTable("classes", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").references(() => schools.id),
  name: text("name").notNull(),
  gradeLevel: text("grade_level").notNull(),
  homeroomTeacherId: text("homeroom_teacher_id").references(() => users.id),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: ts(),
  updatedAt: uts(),
}, (t) => [index("classes_school_idx").on(t.schoolId)]);

export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  nis: text("nis").notNull().unique(),
  nisn: text("nisn").notNull().unique(),
  classId: text("class_id").references(() => classes.id),
  birthDate: text("birth_date"),
  gender: text("gender"),
  parentPhone: text("parent_phone"),
  createdAt: ts(),
  updatedAt: uts(),
}, (t) => [index("students_class_idx").on(t.classId)]);

export const teachers = sqliteTable("teachers", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  nip: text("nip").unique(),
  staffType: text("staff_type").notNull().default("GURU"),
  createdAt: ts(),
  updatedAt: uts(),
});

export const classStudents = sqliteTable("class_students", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  createdAt: ts(),
}, (t) => [uniqueIndex("class_student_uq").on(t.classId, t.studentId)]);

export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  classLevel: text("class_level"),
  createdAt: ts(),
  updatedAt: uts(),
});

export const academicYears = sqliteTable("academic_years", {
  id: text("id").primaryKey(),
  label: text("label").notNull().unique(),
  semester: text("semester").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
  createdAt: ts(),
});

export const questionCategories = sqliteTable("question_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: ts(),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: ts(),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  subjectId: text("subject_id").notNull().references(() => subjects.id),
  classId: text("class_id").references(() => classes.id),
  authorId: text("author_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  stimulus: text("stimulus"),
  prompt: text("prompt").notNull(),
  answerKey: text("answer_key").notNull(),
  explanation: text("explanation"),
  weight: real("weight").notNull().default(1),
  difficulty: text("difficulty").notNull().default("MEDIUM"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: ts(),
  updatedAt: uts(),
}, (t) => [index("questions_subject_idx").on(t.subjectId), index("questions_author_idx").on(t.authorId)]);

export const questionOptions = sqliteTable("question_options", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  optionKey: text("option_key").notNull(),
  content: text("content").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),
  createdAt: ts(),
}, (t) => [uniqueIndex("question_option_key_uq").on(t.questionId, t.optionKey)]);

export const questionTags = sqliteTable("question_tags", {
  id: text("id").primaryKey(),
  questionId: text("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: ts(),
}, (t) => [uniqueIndex("question_tag_uq").on(t.questionId, t.tagId)]);

export const exams = sqliteTable("exams", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  subjectId: text("subject_id").notNull().references(() => subjects.id),
  classId: text("class_id").notNull().references(() => classes.id),
  creatorId: text("creator_id").notNull().references(() => users.id),
  status: text("status").notNull().default("DRAFT"),
  token: text("token"),
  tokenEnabled: integer("token_enabled", { mode: "boolean" }).notNull().default(false),
  tokenExpiresAt: text("token_expires_at"),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  randomQuestionOrder: integer("random_question_order", { mode: "boolean" }).notNull().default(true),
  randomOptionOrder: integer("random_option_order", { mode: "boolean" }).notNull().default(true),
  kkm: integer("kkm").notNull().default(75),
  maxViolations: integer("max_violations").notNull().default(5),
  autoSubmitOnViolation: integer("auto_submit_on_violation", { mode: "boolean" }).notNull().default(true),
  showResult: integer("show_result", { mode: "boolean" }).notNull().default(true),
  showReview: integer("show_review", { mode: "boolean" }).notNull().default(false),
  allowNavigation: integer("allow_navigation", { mode: "boolean" }).notNull().default(true),
  settingsJson: text("settings_json").notNull().default("{}"),
  createdAt: ts(),
  updatedAt: uts(),
}, (t) => [index("exams_status_idx").on(t.status), index("exams_class_idx").on(t.classId)]);

export const examQuestions = sqliteTable("exam_questions", {
  id: text("id").primaryKey(),
  examId: text("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull().references(() => questions.id),
  orderNo: integer("order_no").notNull(),
  weight: real("weight").notNull().default(1),
  createdAt: ts(),
}, (t) => [uniqueIndex("exam_question_uq").on(t.examId, t.questionId), index("exam_question_order_idx").on(t.examId, t.orderNo)]);

export const examParticipants = sqliteTable("exam_participants", {
  id: text("id").primaryKey(),
  examId: text("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("ELIGIBLE"),
  createdAt: ts(),
}, (t) => [uniqueIndex("exam_participant_uq").on(t.examId, t.studentId)]);

export const examSessions = sqliteTable("exam_sessions", {
  id: text("id").primaryKey(),
  examId: text("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id),
  startedAt: text("started_at").notNull(),
  submittedAt: text("submitted_at"),
  expiresAt: text("expires_at").notNull(),
  status: text("status").notNull().default("ACTIVE"),
  questionOrderJson: text("question_order_json").notNull(),
  optionOrderJson: text("option_order_json").notNull(),
  lastActivityAt: text("last_activity_at").notNull(),
  violationCount: integer("violation_count").notNull().default(0),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: ts(),
  updatedAt: uts(),
}, (t) => [index("exam_sessions_exam_idx").on(t.examId), uniqueIndex("exam_sessions_uq").on(t.examId, t.studentId)]);

export const answers = sqliteTable("answers", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => examSessions.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull().references(() => questions.id),
  answerText: text("answer_text"),
  marked: integer("marked", { mode: "boolean" }).notNull().default(false),
  answeredAt: text("answered_at").notNull(),
  createdAt: ts(),
  updatedAt: uts(),
}, (t) => [uniqueIndex("answers_uq").on(t.sessionId, t.questionId)]);

export const answerOptions = sqliteTable("answer_options", {
  id: text("id").primaryKey(),
  answerId: text("answer_id").notNull().references(() => answers.id, { onDelete: "cascade" }),
  optionKey: text("option_key").notNull(),
  createdAt: ts(),
}, (t) => [uniqueIndex("answer_options_uq").on(t.answerId, t.optionKey)]);

export const results = sqliteTable("results", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().unique().references(() => examSessions.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id),
  examId: text("exam_id").notNull().references(() => exams.id),
  score: real("score").notNull(),
  correctCount: integer("correct_count").notNull().default(0),
  wrongCount: integer("wrong_count").notNull().default(0),
  emptyCount: integer("empty_count").notNull().default(0),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  passed: integer("passed", { mode: "boolean" }).notNull().default(false),
  createdAt: ts(),
  updatedAt: uts(),
}, (t) => [index("results_exam_idx").on(t.examId)]);

export const resultDetails = sqliteTable("result_details", {
  id: text("id").primaryKey(),
  resultId: text("result_id").notNull().references(() => results.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull().references(() => questions.id),
  isCorrect: integer("is_correct", { mode: "boolean" }),
  score: real("score").notNull().default(0),
  gradingStatus: text("grading_status").notNull().default("AUTO"),
  graderId: text("grader_id").references(() => users.id),
  createdAt: ts(),
}, (t) => [uniqueIndex("result_detail_uq").on(t.resultId, t.questionId)]);

export const violations = sqliteTable("violations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => examSessions.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id),
  examId: text("exam_id").notNull().references(() => exams.id),
  type: text("type").notNull(),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: ts(),
}, (t) => [index("violations_session_idx").on(t.sessionId)]);

export const monitoringSessions = sqliteTable("monitoring_sessions", {
  id: text("id").primaryKey(),
  examId: text("exam_id").notNull().references(() => exams.id),
  proctorId: text("proctor_id").notNull().references(() => users.id),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: ts(),
  updatedAt: uts(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: ts(),
}, (t) => [index("sessions_user_idx").on(t.userId), index("sessions_exp_idx").on(t.expiresAt)]);

export const authTokens = sqliteTable("auth_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  purpose: text("purpose").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: ts(),
}, (t) => [index("auth_tokens_user_idx").on(t.userId)]);

export const attendance = sqliteTable("attendance", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().references(() => students.id),
  examId: text("exam_id").references(() => exams.id),
  status: text("status").notNull(),
  checkInAt: text("check_in_at"),
  createdAt: ts(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  readAt: text("read_at"),
  createdAt: ts(),
}, (t) => [index("notifications_user_idx").on(t.userId)]);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  metadataJson: text("metadata_json").notNull().default("{}"),
  ipAddress: text("ip_address"),
  createdAt: ts(),
}, (t) => [index("audit_logs_actor_idx").on(t.actorUserId), index("audit_logs_action_idx").on(t.action)]);

export const imports = sqliteTable("imports", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  actorUserId: text("actor_user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("PROCESSING"),
  totalRows: integer("total_rows").notNull().default(0),
  errorRows: integer("error_rows").notNull().default(0),
  reportJson: text("report_json").notNull().default("[]"),
  createdAt: ts(),
  updatedAt: uts(),
});

export const exportsTable = sqliteTable("exports", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  actorUserId: text("actor_user_id").notNull().references(() => users.id),
  filtersJson: text("filters_json").notNull().default("{}"),
  createdAt: ts(),
});
