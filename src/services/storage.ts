import * as FileSystem from 'expo-file-system';
import { Lesson, LessonImport } from '../types/lesson';

const BASE = FileSystem.documentDirectory!;
const LESSONS_DIR = `${BASE}lessons/`;
const AUDIO_DIR = `${BASE}audio/`;
const INDEX_FILE = `${LESSONS_DIR}index.json`;

async function ensureDirs(): Promise<void> {
  await FileSystem.makeDirectoryAsync(LESSONS_DIR, { intermediates: true });
  await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
}

async function readIndex(): Promise<string[]> {
  try {
    const info = await FileSystem.getInfoAsync(INDEX_FILE);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(INDEX_FILE);
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

async function writeIndex(ids: string[]): Promise<void> {
  await FileSystem.writeAsStringAsync(INDEX_FILE, JSON.stringify(ids));
}

export async function getAllLessons(): Promise<Lesson[]> {
  await ensureDirs();
  const ids = await readIndex();
  const lessons: Lesson[] = [];
  for (const id of ids) {
    const lesson = await getLessonById(id);
    if (lesson) lessons.push(lesson);
  }
  return lessons;
}

export async function getLessonById(id: string): Promise<Lesson | null> {
  try {
    const path = `${LESSONS_DIR}${id}.json`;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(path);
    return JSON.parse(raw) as Lesson;
  } catch {
    return null;
  }
}

export async function saveLesson(lesson: Lesson): Promise<void> {
  await ensureDirs();
  await FileSystem.writeAsStringAsync(
    `${LESSONS_DIR}${lesson.id}.json`,
    JSON.stringify(lesson)
  );
  const ids = await readIndex();
  if (!ids.includes(lesson.id)) {
    await writeIndex([...ids, lesson.id]);
  }
}

export async function updateLesson(lesson: Lesson): Promise<void> {
  await FileSystem.writeAsStringAsync(
    `${LESSONS_DIR}${lesson.id}.json`,
    JSON.stringify(lesson)
  );
}

export async function deleteLesson(id: string): Promise<void> {
  await ensureDirs();

  const lessonPath = `${LESSONS_DIR}${id}.json`;
  const lesson = await getLessonById(id);

  const info = await FileSystem.getInfoAsync(lessonPath);
  if (info.exists) await FileSystem.deleteAsync(lessonPath);

  // Remove full audio
  const fullPath = getFullAudioPath(id);
  const fullInfo = await FileSystem.getInfoAsync(fullPath);
  if (fullInfo.exists) await FileSystem.deleteAsync(fullPath);

  // Remove line audio files
  const lineCount = lesson?.lines.length ?? 100;
  for (let i = 0; i < lineCount; i++) {
    const lp = getLineAudioPath(id, i);
    const li = await FileSystem.getInfoAsync(lp);
    if (li.exists) await FileSystem.deleteAsync(lp);
  }

  const ids = await readIndex();
  await writeIndex(ids.filter((x) => x !== id));
}

export async function createLessonFromImport(raw: LessonImport): Promise<Lesson> {
  const id = `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const lesson: Lesson = {
    id,
    title: raw.title,
    description: raw.description,
    tags: raw.tags ?? [],
    createdAt: new Date().toISOString(),
    lines: raw.lines,
    audio: { lines: {} },
    cache: {
      textSaved: true,
      fullAudioSaved: false,
      lineAudioCount: 0,
      audioPending: false,
    },
  };
  await saveLesson(lesson);
  return lesson;
}

export function getFullAudioPath(id: string): string {
  return `${AUDIO_DIR}${id}-full.mp3`;
}

export function getLineAudioPath(id: string, lineIndex: number): string {
  return `${AUDIO_DIR}${id}-line-${lineIndex}.mp3`;
}

export async function downloadAudioToPath(url: string, destPath: string): Promise<void> {
  await ensureDirs();
  const result = await FileSystem.downloadAsync(url, destPath);
  if (result.status !== 200) {
    throw new Error(`Download failed: HTTP ${result.status}`);
  }
}
