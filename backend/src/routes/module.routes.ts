import { Router } from 'express';
import { createModuleLesson, listModuleLessons } from '../controllers/lesson.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/role.middleware.js';
import { validateMiddleware } from '../middleware/validate.middleware.js';
import { createLessonSchema } from '../modules/lessons/schemas/createLessonSchema.js';

const router = Router();

router.get('/:moduleId/lessons', listModuleLessons);
router.post(
  '/:moduleId/lessons',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  validateMiddleware(createLessonSchema),
  createModuleLesson,
);

export default router;
