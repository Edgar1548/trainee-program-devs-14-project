import type { Request, Response } from 'express';
import type { CreateLessonInput } from '../modules/lessons/schemas/createLessonSchema.js';
import { lessonService } from '../services/lesson.service.js';

export const createModuleLesson = async (
  req: Request<{ moduleId: string }, unknown, CreateLessonInput>,
  res: Response,
) => {
  const result = await lessonService.createLesson(req.params.moduleId, req.body);

  return res.status(201).json(result);
};

export const getLessonById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const result = await lessonService.getLessonById(req.params.id);

  return res.status(200).json(result);
};

export const listModuleLessons = async (
  req: Request<{ moduleId: string }>,
  res: Response,
) => {
  const result = await lessonService.listLessonsByModule(req.params.moduleId);

  return res.status(200).json(result);
};
