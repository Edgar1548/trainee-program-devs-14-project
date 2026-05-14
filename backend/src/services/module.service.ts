import { prisma } from '../config/prisma.js';
import type {
  CreateModuleInput,
  UpdateModuleInput,
} from '../modules/courses/schemas/moduleSchema.js';
import { NotFoundError } from '../utils/app-error.js';

const listModulesByCourse = async (courseId: string) => {
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    select: {
      id: true,
    },
  });

  if (!course) {
    throw new NotFoundError('Curso no encontrado');
  }

  const modules = await prisma.module.findMany({
    where: {
      courseId,
    },
    orderBy: {
      order: 'asc',
    },
    select: {
      id: true,
      title: true,
      description: true,
      order: true,
      courseId: true,
      createdAt: true,
      _count: {
        select: {
          lessons: true,
        },
      },
    },
  });

  return modules.map(({ _count, ...module }) => ({
    ...module,
    lessonCount: _count.lessons,
  }));
};

const createModule = async (courseId: string, input: CreateModuleInput) => {
  return prisma.$transaction(async (tx) => {
    const course = await tx.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
      },
    });

    if (!course) {
      throw new NotFoundError('Curso no encontrado');
    }

    const orderAggregate = await tx.module.aggregate({
      where: {
        courseId,
      },
      _max: {
        order: true,
      },
    });
    const nextOrder = (orderAggregate._max.order ?? 0) + 1;

    const module = await tx.module.create({
      data: {
        title: input.title,
        description: input.description,
        order: nextOrder,
        courseId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        courseId: true,
        createdAt: true,
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    const { _count, ...moduleData } = module;

    return {
      ...moduleData,
      lessonCount: _count.lessons,
    };
  });
};

const updateModule = async (moduleId: string, input: UpdateModuleInput) => {
  const existingModule = await prisma.module.findUnique({
    where: {
      id: moduleId,
    },
    select: {
      id: true,
    },
  });

  if (!existingModule) {
    throw new NotFoundError('Modulo no encontrado');
  }

  const module = await prisma.module.update({
    where: {
      id: moduleId,
    },
    data: {
      title: input.title,
      description: input.description,
    },
    select: {
      id: true,
      title: true,
      description: true,
      order: true,
      courseId: true,
      createdAt: true,
      _count: {
        select: {
          lessons: true,
        },
      },
    },
  });

  const { _count, ...moduleData } = module;

  return {
    ...moduleData,
    lessonCount: _count.lessons,
  };
};

const deleteModule = async (moduleId: string) => {
  const module = await prisma.module.findUnique({
    where: {
      id: moduleId,
    },
    select: {
      id: true,
      lessons: {
        select: {
          id: true,
          quizzes: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!module) {
    throw new NotFoundError('Modulo no encontrado');
  }

  const lessonIds = module.lessons.map((lesson) => lesson.id);
  const quizIds = module.lessons.flatMap((lesson) => lesson.quizzes.map((quiz) => quiz.id));

  await prisma.$transaction(async (tx) => {
    if (quizIds.length > 0) {
      await tx.quizAttempt.deleteMany({
        where: {
          quizId: {
            in: quizIds,
          },
        },
      });
    }

    if (lessonIds.length > 0) {
      await tx.quiz.deleteMany({
        where: {
          lessonId: {
            in: lessonIds,
          },
        },
      });

      await tx.progress.deleteMany({
        where: {
          lessonId: {
            in: lessonIds,
          },
        },
      });

      await tx.learningPathItem.deleteMany({
        where: {
          lessonId: {
            in: lessonIds,
          },
        },
      });

      await tx.lesson.deleteMany({
        where: {
          moduleId,
        },
      });
    }

    await tx.module.delete({
      where: {
        id: moduleId,
      },
    });
  });
};

export const moduleService = {
  createModule,
  deleteModule,
  listModulesByCourse,
  updateModule,
};
