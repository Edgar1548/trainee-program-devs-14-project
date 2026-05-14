import { prisma } from '../config/prisma.js';
import { NotFoundError } from '../utils/app-error.js';

const parseLessonContent = (content: string) => {
  try {
    const parsedContent = JSON.parse(content) as unknown;

    if (parsedContent && typeof parsedContent === 'object') {
      return parsedContent;
    }
  } catch {
    // Some legacy lessons may still contain plain text content.
  }

  return {
    time: Date.now(),
    blocks: [
      {
        type: 'paragraph',
        data: {
          text: content,
        },
      },
    ],
  };
};

const listLessonsByModule = async (moduleId: string) => {
  const module = await prisma.module.findUnique({
    where: {
      id: moduleId,
    },
    select: {
      id: true,
    },
  });

  if (!module) {
    throw new NotFoundError('Modulo no encontrado');
  }

  const lessons = await prisma.lesson.findMany({
    where: {
      moduleId,
    },
    orderBy: {
      order: 'asc',
    },
    select: {
      id: true,
      title: true,
      order: true,
      moduleId: true,
      createdAt: true,
      _count: {
        select: {
          quizzes: true,
        },
      },
    },
  });

  return lessons.map(({ _count, ...lesson }) => ({
    ...lesson,
    hasQuiz: _count.quizzes > 0,
  }));
};

const getLessonById = async (lessonId: string) => {
  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      id: true,
      title: true,
      content: true,
      order: true,
      moduleId: true,
      createdAt: true,
      _count: {
        select: {
          quizzes: true,
        },
      },
    },
  });

  if (!lesson) {
    throw new NotFoundError('Leccion no encontrada');
  }

  const { _count, content, ...lessonData } = lesson;

  return {
    ...lessonData,
    content: parseLessonContent(content),
    hasQuiz: _count.quizzes > 0,
  };
};

export const lessonService = {
  getLessonById,
  listLessonsByModule,
};
