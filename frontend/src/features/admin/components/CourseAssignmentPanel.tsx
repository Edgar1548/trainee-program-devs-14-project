import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCourses } from '@/features/courses';
import { useDebounce } from '@/shared/hooks';
import { notify } from '@/shared/providers/notificationEvents';
import { assignmentUsers } from '../data/assignmentUsers';
import { useAssignCourse, useCourseEnrollments, useUnassignCourse } from '../hooks/useCourseAssignments';
import type { AssignmentUser } from '../types/course-assignment.types';
import { AdminSidebar } from './AdminSidebar';
import { UserRow } from './UserRow';

const pageSize = 10;

export function CourseAssignmentPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const coursesQuery = useCourses({ status: 'ALL', page: 1, pageSize: 100 });
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(() => new Set());
  const [users, setUsers] = useState<AssignmentUser[]>(assignmentUsers);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const currentPage = Number(searchParams.get('page') ?? '1') || 1;

  const courses = useMemo(() => coursesQuery.data?.courses ?? [], [coursesQuery.data?.courses]);
  const activeCourseId = selectedCourseId || courses[0]?.id || '';
  const selectedCourse = courses.find((course) => course.id === activeCourseId);
  const enrollmentsQuery = useCourseEnrollments(activeCourseId);
  const assignCourse = useAssignCourse(activeCourseId);
  const unassignCourse = useUnassignCourse(activeCourseId);
  const usersWithEnrollments = useMemo(() => {
    if (!enrollmentsQuery.data) {
      return users;
    }

    const enrolledUsers = new Map(enrollmentsQuery.data.map((user) => [user.id, user]));

    return users.map((user) => {
      const enrolledUser = enrolledUsers.get(user.id);

      return enrolledUser
        ? {
            ...user,
            assignedAt: enrolledUser.assignedAt,
            enrollmentId: enrolledUser.enrollmentId,
            enrollmentStatus: enrolledUser.enrollmentStatus,
            progress: enrolledUser.progress,
          }
        : {
            ...user,
            assignedAt: undefined,
            enrollmentId: undefined,
            enrollmentStatus: undefined,
            progress: undefined,
          };
    });
  }, [enrollmentsQuery.data, users]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return usersWithEnrollments;
    }

    return usersWithEnrollments.filter((user) => {
      return (
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [debouncedSearchTerm, usersWithEnrollments]);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleUsers = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();
    const nextFilteredUsers = normalizedSearch
      ? usersWithEnrollments.filter((user) => {
          return (
            user.name.toLowerCase().includes(normalizedSearch) ||
            user.email.toLowerCase().includes(normalizedSearch)
          );
        })
      : usersWithEnrollments;
    const pageForSlice = Math.min(currentPage, Math.max(1, Math.ceil(nextFilteredUsers.length / pageSize)));
    const startIndex = (pageForSlice - 1) * pageSize;

    return nextFilteredUsers.slice(startIndex, startIndex + pageSize);
  }, [currentPage, debouncedSearchTerm, usersWithEnrollments]);

  const selectedCount = selectedUserIds.size;
  const selectedUsers = useMemo(() => {
    return usersWithEnrollments.filter((user) => selectedUserIds.has(user.id));
  }, [selectedUserIds, usersWithEnrollments]);
  const hasAssignableSelection = selectedUsers.some((user) => !user.assignedAt);
  const hasUnassignableSelection = selectedUsers.some((user) => Boolean(user.assignedAt));

  const setPage = useCallback(
    (page: number) => {
      setSearchParams((current) => {
        const nextParams = new URLSearchParams(current);
        nextParams.set('page', String(page));
        return nextParams;
      });
    },
    [setSearchParams],
  );

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUserIds((current) => {
      const nextSelection = new Set(current);

      if (nextSelection.has(userId)) {
        nextSelection.delete(userId);
      } else {
        nextSelection.add(userId);
      }

      return nextSelection;
    });
  }, []);

  const handleAssign = useCallback((userId: string) => {
    const assignedAt = new Date().toISOString();

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              assignedAt,
            }
          : user,
      ),
    );
    assignCourse.mutate(userId, {
      onSuccess: () => {
        notify({
          title: 'Usuario asignado',
          description: 'El usuario fue asignado al curso seleccionado.',
          variant: 'success',
        });
      },
      onError: () => {
        notify({
          title: 'Asignacion pendiente de API',
          description: 'La UI quedo actualizada localmente, pero el endpoint de asignacion aun no respondio correctamente.',
          variant: 'info',
        });
      },
    });
  }, [assignCourse]);

  const handleUnassign = useCallback((userId: string) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              assignedAt: undefined,
            }
          : user,
      ),
    );
    unassignCourse.mutate(userId, {
      onSuccess: () => {
        notify({
          title: 'Usuario desasignado',
          description: 'El usuario fue removido del curso seleccionado.',
          variant: 'success',
        });
      },
      onError: () => {
        notify({
          title: 'Desasignacion pendiente de API',
          description: 'La UI quedo actualizada localmente, pero el endpoint de desasignacion aun no respondio correctamente.',
          variant: 'info',
        });
      },
    });
  }, [unassignCourse]);

  const handleBulkAssign = useCallback(() => {
    const assignedAt = new Date().toISOString();
    const assignableCount = selectedUsers.filter((user) => !user.assignedAt).length;

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        selectedUserIds.has(user.id)
          ? {
              ...user,
              assignedAt,
            }
          : user,
      ),
    );
    setSelectedUserIds(new Set());
    Promise.all(selectedUsers.filter((user) => !user.assignedAt).map((user) => assignCourse.mutateAsync(user.id)))
      .then(() => {
        notify({
          title: 'Usuarios asignados',
          description: `${assignableCount} ${assignableCount === 1 ? 'usuario fue asignado' : 'usuarios fueron asignados'} correctamente.`,
          variant: 'success',
        });
      })
      .catch(() => {
        notify({
          title: 'Asignaciones pendientes de API',
          description: 'La UI quedo actualizada localmente, pero el endpoint de asignacion aun no respondio correctamente.',
          variant: 'info',
        });
      });
  }, [assignCourse, selectedUserIds, selectedUsers]);

  const handleBulkUnassign = useCallback(() => {
    const unassignableCount = selectedUsers.filter((user) => Boolean(user.assignedAt)).length;

    setUsers((currentUsers) =>
      currentUsers.map((user) => {
        if (!selectedUserIds.has(user.id)) {
          return user;
        }

        return {
          ...user,
          assignedAt: undefined,
        };
      }),
    );
    setSelectedUserIds(new Set());
    Promise.all(selectedUsers.filter((user) => user.assignedAt).map((user) => unassignCourse.mutateAsync(user.id)))
      .then(() => {
        notify({
          title: 'Usuarios desasignados',
          description: `${unassignableCount} ${
            unassignableCount === 1 ? 'usuario fue desasignado' : 'usuarios fueron desasignados'
          } correctamente.`,
          variant: 'success',
        });
      })
      .catch(() => {
        notify({
          title: 'Desasignaciones pendientes de API',
          description: 'La UI quedo actualizada localmente, pero el endpoint de desasignacion aun no respondio correctamente.',
          variant: 'info',
        });
      });
  }, [selectedUserIds, selectedUsers, unassignCourse]);

  return (
    <main className="min-h-svh bg-[var(--bg)]">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[240px_1fr]">
        <AdminSidebar />

        <section className="grid gap-6" aria-labelledby="course-assignment-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Panel de administracion</p>
            <h1 id="course-assignment-title" className="text-3xl font-bold">
              Asignacion de cursos
            </h1>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin/dashboard">Volver al dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Curso a asignar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {coursesQuery.isLoading ? (
              <Skeleton className="h-10 w-full max-w-xl" />
            ) : coursesQuery.error ? (
              <div className="grid gap-3 rounded-lg border border-destructive bg-[var(--danger-bg)] p-4">
                <p className="font-semibold text-destructive">No pudimos cargar los cursos.</p>
                <Button className="w-fit" type="button" onClick={() => void coursesQuery.refetch()}>
                  Reintentar
                </Button>
              </div>
            ) : courses.length > 0 ? (
              <label className="grid max-w-xl gap-2">
                <span className="font-semibold text-foreground">Selecciona un curso</span>
                <select
                  className="h-10 rounded-lg border border-input bg-background px-3 text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={activeCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                No hay cursos disponibles para asignar.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios disponibles</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {selectedCourse ? (
              <p className="text-sm text-muted-foreground">
                Mostrando usuarios disponibles para asignar a {selectedCourse.title}.
              </p>
            ) : null}
            {enrollmentsQuery.error ? (
              <p className="rounded-lg border border-border bg-[var(--bg)] p-3 text-sm text-muted-foreground">
                Los endpoints de asignacion todavia no estan disponibles; se muestra el estado local de la interfaz.
              </p>
            ) : null}

            <label className="grid max-w-xl gap-2">
              <span className="font-semibold text-foreground">Buscar usuario</span>
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre o email"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-[var(--bg)] p-3">
              <p className="text-sm font-semibold text-foreground">
                {selectedCount} {selectedCount === 1 ? 'usuario seleccionado' : 'usuarios seleccionados'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleBulkAssign}
                  disabled={!activeCourseId || selectedCount === 0 || !hasAssignableSelection}
                >
                  Asignar seleccionados
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBulkUnassign}
                  disabled={!activeCourseId || selectedCount === 0 || !hasUnassignableSelection}
                >
                  Desasignar seleccionados
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Seleccion</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Fecha de asignacion</TableHead>
                    <TableHead className="text-right">Accion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isSelected={selectedUserIds.has(user.id)}
                      isCourseSelected={Boolean(activeCourseId)}
                      onAssign={handleAssign}
                      onToggleSelection={toggleUserSelection}
                      onUnassign={handleUnassign}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Pagina {safeCurrentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setPage(Math.max(1, safeCurrentPage - 1))}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setPage(Math.min(totalPages, safeCurrentPage + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                No hay usuarios que coincidan con la busqueda.
              </p>
            ) : null}
          </CardContent>
        </Card>
        </section>
      </div>
    </main>
  );
}
