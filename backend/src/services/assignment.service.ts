import { prisma } from '../config/prisma.js';
import type { AssignCourseInput } from '../modules/courses/schemas/assignCourseSchema.js';
import { ConflictError, NotFoundError } from '../utils/app-error.js';

const assignCourse = async (courseId: string, input: AssignCourseInput) => {
  const [course, user] = await Promise.all([
    prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        title: true,
        authorId: true,
      },
    }),
    prisma.user.findUnique({
      where: {
        id: input.userId,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!course) {
    throw new NotFoundError('Curso no encontrado');
  }

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: input.userId,
        courseId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingEnrollment) {
    throw new ConflictError('El usuario ya esta asignado a este curso');
  }

  return prisma.$transaction(async (tx) => {
    const defaultLearningPath =
      (await tx.learningPath.findFirst({
        where: {
          courseId,
          isDefault: true,
        },
        select: {
          id: true,
        },
      })) ??
      (await tx.learningPath.create({
        data: {
          name: `${course.title} - Default Path`,
          description: 'Ruta por defecto generada para asignaciones del curso.',
          userId: course.authorId,
          courseId,
          isDefault: true,
          isForked: false,
        },
        select: {
          id: true,
        },
      }));

    return tx.enrollment.create({
      data: {
        userId: input.userId,
        courseId,
        learningPathId: defaultLearningPath.id,
      },
      select: {
        id: true,
        userId: true,
        courseId: true,
        learningPathId: true,
        status: true,
        enrolledAt: true,
      },
    });
  });
};

const unassignCourse = async (courseId: string, userId: string) => {
  const [course, user] = await Promise.all([
    prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
      },
    }),
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!course) {
    throw new NotFoundError('Curso no encontrado');
  }

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!enrollment) {
    throw new NotFoundError('Asignacion no encontrada');
  }

  await prisma.enrollment.delete({
    where: {
      id: enrollment.id,
    },
  });
};

export const assignmentService = {
  assignCourse,
  unassignCourse,
};
