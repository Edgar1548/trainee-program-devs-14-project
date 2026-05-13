import { Router } from 'express';
import {
  getCourseById,
  listCourses,
} from '../controllers/course.controller.js';

const router = Router();

router.get('/', listCourses);
router.get('/:id', getCourseById);

export default router;
