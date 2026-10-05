import { z } from "zod";

export const loginSchema = z.object({
  identity: z.string().min(3).max(50).trim(),
  password: z.string().min(6).max(72),
});

export const studentCreateSchema = z.object({
  fullName: z.string().min(2).max(120),
  username: z.string().min(3).max(40).regex(/^[a-zA-Z0-9_.-]+$/),
  participantNumber: z.string().min(3).max(30),
  nis: z.string().min(3).max(20),
  nisn: z.string().min(3).max(20),
  classId: z.string().min(1),
  password: z.string().min(6).max(72),
});

export const questionSchema = z.object({
  subjectId: z.string().min(1),
  classId: z.string().optional(),
  type: z.enum(["SINGLE_CHOICE", "MULTI_CHOICE", "TRUE_FALSE_MULTI", "MATCHING", "SHORT_ANSWER", "ESSAY"]),
  prompt: z.string().min(3),
  stimulus: z.string().optional(),
  answerKey: z.string().min(1),
  explanation: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  weight: z.number().min(0.1).max(10).default(1),
  options: z.array(z.object({ optionKey: z.string().min(1), content: z.string().min(1), isCorrect: z.boolean() })).default([]),
});

export const examSchema = z.object({
  code: z.string().trim().toUpperCase().min(4).max(16),
  title: z.string().min(3).max(120),
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().max(300),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "FINISHED", "ARCHIVED"]).default("DRAFT"),
  tokenEnabled: z.boolean().default(false),
  token: z.string().trim().toUpperCase().max(16).optional(),
  tokenExpiresAt: z.string().datetime().optional(),
  kkm: z.number().int().min(0).max(100).default(75),
  maxViolations: z.number().int().min(1).max(20).default(5),
  randomQuestionOrder: z.boolean().default(true),
  randomOptionOrder: z.boolean().default(true),
  questionIds: z.array(z.string()).min(1),
});

export const examStartSchema = z.object({
  token: z.string().trim().toUpperCase().optional(),
});

export const autosaveSchema = z.object({
  sessionId: z.string().min(1),
  answers: z.array(z.object({
    questionId: z.string().min(1),
    answerText: z.string().optional(),
    marked: z.boolean().optional(),
    selectedOptions: z.array(z.string()).optional(),
  })).min(1),
});

export const submitSchema = z.object({
  sessionId: z.string().min(1),
});

export const violationSchema = z.object({
  sessionId: z.string().min(1),
  examId: z.string().min(1),
  type: z.enum(["TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXIT", "COPY", "PASTE", "RIGHT_CLICK", "SHORTCUT"]),
  metadata: z.record(z.string(), z.string()).default({}),
});
