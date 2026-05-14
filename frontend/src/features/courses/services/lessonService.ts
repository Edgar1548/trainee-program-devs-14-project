import { api } from '@/shared/lib';
import type { CourseDetail } from '../types/course.types';

type CourseLesson = CourseDetail['modules'][number]['lessons'][number];

type EditorContent = Record<string, unknown>;

type BackendLesson = {
  id: string;
  title: string;
  content?: EditorContent;
  order: number;
  moduleId: string;
  hasQuiz?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const emptyEditorContent: EditorContent = {
  time: Date.now(),
  blocks: [],
  version: '2.28.0',
};

const parseEditorContent = (content?: string): EditorContent => {
  if (!content) {
    return emptyEditorContent;
  }

  try {
    const parsedContent = JSON.parse(content) as unknown;
    return parsedContent && typeof parsedContent === 'object' ? (parsedContent as EditorContent) : emptyEditorContent;
  } catch {
    return emptyEditorContent;
  }
};

const stringifyEditorContent = (content?: EditorContent): string => {
  return JSON.stringify(content ?? emptyEditorContent);
};

const toCourseLesson = (lesson: BackendLesson): CourseLesson => ({
  id: lesson.id,
  title: lesson.title,
  content: stringifyEditorContent(lesson.content),
  order: lesson.order,
});

export const lessonService = {
  async listLessons(moduleId: string): Promise<CourseLesson[]> {
    const { data } = await api.get<BackendLesson[]>(`/api/modules/${moduleId}/lessons`);
    return data.map(toCourseLesson);
  },

  async getLesson(lessonId: string): Promise<CourseLesson> {
    const { data } = await api.get<BackendLesson>(`/api/lessons/${lessonId}`);
    return toCourseLesson(data);
  },

  async createLesson(moduleId: string, payload: Pick<CourseLesson, 'title' | 'content'>): Promise<CourseLesson> {
    const { data } = await api.post<BackendLesson>(`/api/modules/${moduleId}/lessons`, {
      title: payload.title,
      content: parseEditorContent(payload.content),
    });
    return toCourseLesson(data);
  },

  async updateLesson(lessonId: string, payload: Pick<CourseLesson, 'title' | 'content'>): Promise<CourseLesson> {
    const { data } = await api.put<BackendLesson>(`/api/lessons/${lessonId}`, {
      title: payload.title,
      content: parseEditorContent(payload.content),
    });
    return toCourseLesson(data);
  },

  async deleteLesson(lessonId: string): Promise<void> {
    await api.delete(`/api/lessons/${lessonId}`);
  },

  async reorderLessons(lessons: Array<Pick<CourseLesson, 'id' | 'order'>>): Promise<void> {
    await api.patch('/api/lessons/reorder', {
      lessons: lessons.filter((lesson): lesson is { id: string; order: number } => Boolean(lesson.id)),
    });
  },
};
