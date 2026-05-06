import { api } from '@/shared/lib';
import type { CourseFormData } from '../schemas/course.schema';
import type { CourseDetail, CoursesListResponse, CoursesQueryParams } from '../types/course.types';

const toSearchParams = (params: CoursesQueryParams) => {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.status && params.status !== 'ALL') {
    searchParams.set('status', params.status);
  }

  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('pageSize', String(params.pageSize ?? 10));

  return searchParams;
};

export const courseService = {
  async listCourses(params: CoursesQueryParams): Promise<CoursesListResponse> {
    const searchParams = toSearchParams(params);
    const { data } = await api.get<CoursesListResponse>(`/api/admin/courses?${searchParams.toString()}`);
    return data;
  },

  async getCourse(courseId: string): Promise<CourseDetail> {
    const { data } = await api.get<CourseDetail>(`/api/admin/courses/${courseId}`);
    return data;
  },

  async createCourse(payload: CourseFormData): Promise<CourseDetail> {
    const { data } = await api.post<CourseDetail>('/api/admin/courses', payload);
    return data;
  },

  async updateCourse(courseId: string, payload: CourseFormData): Promise<CourseDetail> {
    const { data } = await api.put<CourseDetail>(`/api/admin/courses/${courseId}`, payload);
    return data;
  },

  async deleteCourse(courseId: string): Promise<void> {
    await api.delete(`/api/admin/courses/${courseId}`);
  },
};
