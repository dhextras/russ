export interface LessonLine {
  ru: string;
  en: string;
}

export interface LessonAudio {
  full?: string;
  lines: Record<string, string>; // lineIndex -> local file URI
}

export interface LessonCache {
  textSaved: boolean;
  fullAudioSaved: boolean;
  lineAudioCount: number;
  audioPending: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  lines: LessonLine[];
  audio: LessonAudio;
  cache: LessonCache;
}

// Raw shape when importing (no id, timestamps, or audio fields yet)
export interface LessonImport {
  title: string;
  description: string;
  tags?: string[];
  lines: LessonLine[];
}
