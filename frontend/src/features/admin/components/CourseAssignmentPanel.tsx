import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourses } from '@/features/courses';
import { useDebounce } from '@/shared/hooks';
import { assignmentUsers } from '../data/assignmentUsers';
import { AdminSidebar } from './AdminSidebar';

export function CourseAssignmentPanel() {
  const coursesQuery = useCourses({ status: 'ALL', page: 1, pageSize: 100 });
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const courses = useMemo(() => coursesQuery.data?.courses ?? [], [coursesQuery.data?.courses]);
  const activeCourseId = selectedCourseId || courses[0]?.id || '';
  const selectedCourse = courses.find((course) => course.id === activeCourseId);
  const filteredUsers = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return assignmentUsers;
    }

    return assignmentUsers.filter((user) => {
      return (
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [debouncedSearchTerm]);

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

            <label className="grid max-w-xl gap-2">
              <span className="font-semibold text-foreground">Buscar usuario</span>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre o email"
              />
            </label>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-sm text-muted-foreground">
                    <th className="py-3 pr-4">Usuario</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Rol</th>
                    <th className="py-3 text-right">Asignacion</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-b-0">
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-foreground">{user.name}</p>
                      </td>
                      <td className="py-4 pr-4">{user.email}</td>
                      <td className="py-4 pr-4">{user.role === 'ADMIN' ? 'Administrador' : 'Estudiante'}</td>
                      <td className="py-4 text-right">
                        <Button type="button" variant="outline" size="sm" disabled={!activeCourseId}>
                          Disponible
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
