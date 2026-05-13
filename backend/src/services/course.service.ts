import { CourseDifficulty, CourseStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import type { CreateCourseInput } from '../modules/courses/schemas/createCourseSchema.js';
import type { ListCoursesQuery } from '../modules/courses/schemas/listCoursesSchema.js';
import type { UpdateCourseInput } from '../modules/courses/schemas/updateCourseSchema.js';
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


export const courseService = {
  listCourses,
};
