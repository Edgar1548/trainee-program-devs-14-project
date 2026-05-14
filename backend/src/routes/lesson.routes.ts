import { Router } from 'express';
import { getLessonById } from '../controllers/lesson.controller.js';

const router = Router();

router.get('/:id', getLessonById);

export default router;
