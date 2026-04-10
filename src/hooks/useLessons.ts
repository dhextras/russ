import { useState, useCallback } from 'react';
import { Lesson, LessonImport } from '../types/lesson';
import { getAllLessons, createLessonFromImport, deleteLesson, getLessonById } from '../services/storage';

export function useLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllLessons();
      setLessons(all);
    } finally {
      setLoading(false);
    }
  }, []);

  const addLesson = useCallback(async (raw: LessonImport): Promise<Lesson> => {
    const lesson = await createLessonFromImport(raw);
    setLessons((prev) => [...prev, lesson]);
    return lesson;
  }, []);

  const removeLesson = useCallback(async (id: string) => {
    await deleteLesson(id);
    setLessons((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const refreshLesson = useCallback(async (id: string) => {
    const updated = await getLessonById(id);
    if (updated) {
      setLessons((prev) => prev.map((l) => (l.id === id ? updated : l)));
    }
  }, []);

  return { lessons, loading, load, addLesson, removeLesson, refreshLesson };
}
