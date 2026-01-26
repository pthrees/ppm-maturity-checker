import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  answers: jsonb("answers").notNull(), // Stores { [questionId]: { maturity: number, importance: number } }
  userInfo: jsonb("user_info"), // Optional: company name, role, etc.
  email: text("email"), // Add email field
  createdAt: timestamp("created_at").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertAssessmentSchema = createInsertSchema(assessments).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

// Input for creating an assessment
// Validation for answers structure
export const answerSchema = z.object({
  maturity: z.number().min(0).max(3),
  importance: z.number().min(1).max(3),
});

export const createAssessmentRequestSchema = z.object({
  answers: z.record(z.string(), answerSchema), // Key is question ID (e.g., "A1", "B2")
  email: z.string().email("有効なメールアドレスを入力してください。").optional(),
  userInfo: z.object({
    companyName: z.string().optional(),
    role: z.string().optional(),
    companySize: z.string().optional(),
    name: z.string().optional(),
  }).optional(),
});

export type CreateAssessmentRequest = z.infer<typeof createAssessmentRequestSchema>;
export type AssessmentResponse = Assessment;

// Category definitions for shared logic
export const CATEGORIES = {
  A: "稼働管理",
  B: "スキル・配員",
  C: "収益性管理",
  D: "プロセス成熟度",
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
