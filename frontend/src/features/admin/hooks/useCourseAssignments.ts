import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '../services/assignmentService';

export const courseAssignmentsQueryKey = ['course-assignments'] as const;

export function useCourseEnrollments(courseId?: string) {
  return useQuery({
    queryKey: [...courseAssignmentsQueryKey, courseId, 'enrollments'],
    queryFn: () => assignmentService.getCourseEnrollments(courseId ?? ''),
    enabled: Boolean(courseId),
    retry: false,
  });
}

export function useAssignCourse(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => assignmentService.assignCourse(courseId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...courseAssignmentsQueryKey, courseId, 'enrollments'] });
    },
  });
}

export function useUnassignCourse(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => assignmentService.unassignCourse(courseId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...courseAssignmentsQueryKey, courseId, 'enrollments'] });
    },
  });
}
