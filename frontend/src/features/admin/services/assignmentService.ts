import { api } from '@/shared/lib';
import type { AssignmentUser, CourseEnrollment } from '../types/course-assignment.types';

type AssignCourseResponse = {
  id: string;
  userId: string;
  courseId: string;
  learningPathId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
};

const toAssignmentUser = (enrollment: CourseEnrollment): AssignmentUser => ({
  id: enrollment.user.id,
  name: enrollment.user.name,
  email: enrollment.user.email,
  role: 'STUDENT',
  assignedAt: enrollment.enrolledAt,
  enrollmentId: enrollment.id,
  enrollmentStatus: enrollment.status,
  progress: enrollment.progress,
});

export const assignmentService = {
  async getCourseEnrollments(courseId: string): Promise<AssignmentUser[]> {
    const { data } = await api.get<CourseEnrollment[]>(`/api/courses/${courseId}/enrollments`);
    return data.map(toAssignmentUser);
  },

  async assignCourse(courseId: string, userId: string): Promise<AssignCourseResponse> {
    const { data } = await api.post<AssignCourseResponse>(`/api/courses/${courseId}/assign`, { userId });
    return data;
  },

  async unassignCourse(courseId: string, userId: string): Promise<void> {
    await api.delete(`/api/courses/${courseId}/assign/${userId}`);
  },
};
