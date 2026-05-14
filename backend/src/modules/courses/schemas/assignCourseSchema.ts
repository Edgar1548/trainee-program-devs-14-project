import { z } from 'zod';

export const assignCourseSchema = z.object({
  userId: z.string().trim().min(1, 'El userId es requerido'),
});

export type AssignCourseInput = z.infer<typeof assignCourseSchema>;
