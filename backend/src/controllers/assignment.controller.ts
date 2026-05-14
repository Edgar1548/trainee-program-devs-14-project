import type { Request, Response } from 'express';
import type { AssignCourseInput } from '../modules/courses/schemas/assignCourseSchema.js';
import { assignmentService } from '../services/assignment.service.js';

export const assignCourse = async (
  req: Request<{ courseId: string }, unknown, AssignCourseInput>,
  res: Response,
) => {
  const result = await assignmentService.assignCourse(req.params.courseId, req.body);

  return res.status(201).json(result);
};
