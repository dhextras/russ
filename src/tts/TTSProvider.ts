import { Lesson, LessonLine } from '../types/lesson';

export interface TTSProvider {
  getProviderName(): string;
  isAvailable(): Promise<boolean>;
  generateFullLessonAudio(lesson: Lesson, destPath: string): Promise<void>;
  generateLineAudio(line: LessonLine, lessonId: string, lineIndex: number, destPath: string): Promise<void>;
}
