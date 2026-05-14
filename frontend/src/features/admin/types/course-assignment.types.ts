export type AssignmentUser = {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  assignedAt?: string;
  enrollmentId?: string;
  enrollmentStatus?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  progress?: number;
};

export type CourseEnrollment = {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  progress: number;
  enrolledAt: string;
};
