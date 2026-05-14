import { prisma } from '../config/prisma.js';
import type { CreateModuleInput } from '../modules/courses/schemas/moduleSchema.js';
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

export const moduleService = {
  createModule,
  listModulesByCourse,
};
