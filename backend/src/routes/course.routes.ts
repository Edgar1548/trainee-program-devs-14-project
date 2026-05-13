import { Router } from 'express';
import { createCourse, getCourseById, listCourses } from '../controllers/course.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/role.middleware.js';
import { validateMiddleware } from '../middleware/validate.middleware.js';
import { createCourseSchema } from '../modules/courses/schemas/createCourseSchema.js';

const router = Router();

router.get('/', listCourses);
router.post('/', authMiddleware, roleMiddleware(['ADMIN']), validateMiddleware(createCourseSchema), createCourse);
router.get('/:id', getCourseById);

export default router;
