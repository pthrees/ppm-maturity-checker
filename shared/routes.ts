import { z } from 'zod';
import { createAssessmentRequestSchema, assessments } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  assessments: {
    create: {
      method: 'POST' as const,
      path: '/api/assessments',
      input: createAssessmentRequestSchema,
      responses: {
        201: z.custom<typeof assessments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/assessments/:id',
      responses: {
        200: z.custom<typeof assessments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

// ============================================
// HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPES
// ============================================
export type CreateAssessmentInput = z.infer<typeof api.assessments.create.input>;
export type AssessmentResponse = z.infer<typeof api.assessments.create.responses[201]>;
