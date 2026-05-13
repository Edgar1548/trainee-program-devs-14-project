import type { Request, Response } from 'express';
import { listCoursesQuerySchema } from '../modules/courses/schemas/listCoursesSchema.js';
import { courseService } from '../services/course.service.js';

export const listCourses = async (req: Request, res: Response) => {
  const query = listCoursesQuerySchema.parse(req.query);
  const result = await courseService.listCourses(query);

  return res.status(200).json(result);
};

export const getCourseById = async (req: Request<{ id: string }>, res: Response) => {
  const result = await courseService.getCourseById(req.params.id);

  return res.status(200).json(result);
};
