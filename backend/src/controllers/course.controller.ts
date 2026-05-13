import type { Request, Response } from 'express';
import { listCoursesQuerySchema } from '../modules/courses/schemas/listCoursesSchema.js';
import { courseService } from '../services/course.service.js';

export const listCourses = async (req: Request, res: Response) => {
  const query = listCoursesQuerySchema.parse(req.query);
  const result = await courseService.listCourses(query);

  return res.status(200).json(result);
};
