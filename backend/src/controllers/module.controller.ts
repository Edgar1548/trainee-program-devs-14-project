import type { Request, Response } from 'express';
import type { CreateModuleInput } from '../modules/courses/schemas/moduleSchema.js';
import { moduleService } from '../services/module.service.js';

export const listCourseModules = async (
  req: Request<{ courseId: string }>,
  res: Response,
) => {
  const result = await moduleService.listModulesByCourse(req.params.courseId);

  return res.status(200).json(result);
};

export const createCourseModule = async (
  req: Request<{ courseId: string }, unknown, CreateModuleInput>,
  res: Response,
) => {
  const result = await moduleService.createModule(req.params.courseId, req.body);

  return res.status(201).json(result);
};
