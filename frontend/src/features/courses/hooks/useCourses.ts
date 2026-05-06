import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courseService } from '../services/courseService';
import type { CourseFormData } from '../schemas/course.schema';
import type { CoursesQueryParams } from '../types/course.types';

export const coursesQueryKey = ['courses'] as const;

export function useCourses(params: CoursesQueryParams) {
  return useQuery({
    queryKey: [...coursesQueryKey, params],
    queryFn: () => courseService.listCourses(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCourse(courseId?: string) {
  return useQuery({
    queryKey: [...coursesQueryKey, courseId],
    queryFn: () => courseService.getCourse(courseId ?? ''),
    enabled: Boolean(courseId),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CourseFormData) => courseService.createCourse(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: coursesQueryKey });
    },
  });
}

export function useUpdateCourse(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CourseFormData) => courseService.updateCourse(courseId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: coursesQueryKey });
      await queryClient.invalidateQueries({ queryKey: [...coursesQueryKey, courseId] });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => courseService.deleteCourse(courseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: coursesQueryKey });
    },
  });
}
