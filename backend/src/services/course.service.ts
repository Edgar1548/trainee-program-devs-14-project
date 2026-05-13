import { CourseDifficulty, CourseStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import type { CreateCourseInput } from '../modules/courses/schemas/createCourseSchema.js';
import type { ListCoursesQuery } from '../modules/courses/schemas/listCoursesSchema.js';
import { NotFoundError } from '../utils/app-error.js';

const buildCourseWhere = ({ search, isPublic }: Pick<ListCoursesQuery, 'search' | 'isPublic'>) => {
  const where: Prisma.CourseWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (isPublic === true) {
    where.status = CourseStatus.PUBLISHED;
  }

  if (isPublic === false) {
    where.status = {
      not: CourseStatus.PUBLISHED,
    };
  }

  return where;
};

const listCourses = async (query: ListCoursesQuery) => {
  const where = buildCourseWhere(query);
  const skip = (query.page - 1) * query.limit;

  const [total, courses] = await prisma.$transaction([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        coverImage: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / query.limit);

  return {
    data: courses.map(({ _count, ...course }) => ({
      ...course,
      isPublic: course.status === CourseStatus.PUBLISHED,
      enrollmentCount: _count.enrollments,
    })),
    pagination: {
      total,
      totalPages,
      currentPage: query.page,
      limit: query.limit,
    },
  };
};

const getCourseById = async (courseId: string) => {
  const course = await prisma.course.findUnique({
    where: {
      id: courseId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      difficulty: true,
      coverImage: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      modules: {
        orderBy: {
          order: 'asc',
        },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          createdAt: true,
          lessons: {
            orderBy: {
              order: 'asc',
            },
            select: {
              id: true,
              title: true,
              type: true,
              duration: true,
              order: true,
              createdAt: true,
            },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  if (!course) {
    throw new NotFoundError('Curso no encontrado');
  }

  const { _count, ...courseData } = course;

  return {
    ...courseData,
    isPublic: course.status === CourseStatus.PUBLISHED,
    enrollmentCount: _count.enrollments,
  };
};

const createCourse = async (input: CreateCourseInput, authorId: string) => {
  const course = await prisma.course.create({
    data: {
      title: input.title,
      description: input.description,
      category: 'General',
      difficulty: CourseDifficulty.BEGINNER,
      status: input.isPublic ? CourseStatus.PUBLISHED : CourseStatus.DRAFT,
      authorId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      difficulty: true,
      coverImage: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    ...course,
    isPublic: course.status === CourseStatus.PUBLISHED,
  };
};

export const courseService = {
  listCourses,
  getCourseById,
  createCourse,
};
