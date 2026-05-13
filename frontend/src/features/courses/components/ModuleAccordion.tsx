import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { CourseDetail } from '../types/course.types';

type ModuleAccordionProps = {
  modules: CourseDetail['modules'];
  onEditModule?: (moduleId: string) => void;
  onDeleteModule?: (moduleId: string) => void;
  onMoveModule?: (moduleId: string, direction: 'up' | 'down') => void;
  onEditLesson?: (lessonId: string) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onMoveLesson?: (moduleId: string, lessonId: string, direction: 'up' | 'down') => void;
};

export function ModuleAccordion({
  modules,
  onEditModule,
  onDeleteModule,
  onMoveModule,
  onEditLesson,
  onDeleteLesson,
  onMoveLesson,
}: ModuleAccordionProps) {
  if (modules.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Este curso todavia no tiene modulos.
      </p>
    );
  }

  const firstModuleValue = modules[0]?.id ?? String(modules[0]?.order);

  return (
    <Accordion type="multiple" defaultValue={firstModuleValue ? [firstModuleValue] : []}>
      {modules.map((module, index) => (
        <AccordionItem key={module.id ?? module.order} value={module.id ?? String(module.order)}>
          <AccordionTrigger>
            <span className="grid gap-1">
              <span className="font-semibold">{module.title}</span>
              <span className="text-sm text-muted-foreground">
                {module.lessons.length} {module.lessons.length === 1 ? 'leccion' : 'lecciones'}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4">
              {module.description ? <p className="text-sm text-muted-foreground">{module.description}</p> : null}

              <div className="flex flex-wrap gap-2" aria-label={`Acciones para ${module.title}`}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => module.id && onEditModule?.(module.id)}
                  disabled={!module.id}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => module.id && onDeleteModule?.(module.id)}
                  disabled={!module.id}
                >
                  Eliminar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => module.id && onMoveModule?.(module.id, 'up')}
                  disabled={!module.id || index === 0}
                >
                  Subir
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => module.id && onMoveModule?.(module.id, 'down')}
                  disabled={!module.id || index === modules.length - 1}
                >
                  Bajar
                </Button>
              </div>

              <div className="grid gap-3">
                <p className="text-sm font-semibold text-foreground">Lecciones</p>
                {module.lessons.length > 0 ? (
                  <ol className="grid gap-2">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <li
                        key={lesson.id ?? lesson.order}
                        className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[auto_1fr_auto] md:items-center"
                      >
                        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {lesson.order}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{lesson.title}</p>
                          <p className="text-sm text-muted-foreground">Orden {lesson.order}</p>
                        </div>
                        <div className="flex flex-wrap gap-2" aria-label={`Acciones para ${lesson.title}`}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => lesson.id && onEditLesson?.(lesson.id)}
                            disabled={!lesson.id}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => lesson.id && onDeleteLesson?.(lesson.id)}
                            disabled={!lesson.id}
                          >
                            Eliminar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => module.id && lesson.id && onMoveLesson?.(module.id, lesson.id, 'up')}
                            disabled={!module.id || !lesson.id || lessonIndex === 0}
                          >
                            Subir
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => module.id && lesson.id && onMoveLesson?.(module.id, lesson.id, 'down')}
                            disabled={!module.id || !lesson.id || lessonIndex === module.lessons.length - 1}
                          >
                            Bajar
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                    Este modulo todavia no tiene lecciones.
                  </p>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
