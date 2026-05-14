export type AssignmentUser = {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  assignedAt?: string;
};
