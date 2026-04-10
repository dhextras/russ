// Handles TTS generation and audio cache management.
// Actual playback lives in useAudioPlayback hook.

import * as FileSystem from 'expo-file-system';
import { TTSProvider } from '../tts/TTSProvider';
import { SileroProvider } from '../tts/SileroProvider';
import { getLessonById, getFullAudioPath, getLineAudioPath, updateLesson } from './storage';
import { getSettings } from './settingsService';

let _provider: TTSProvider | null = null;

async function getProvider(): Promise<TTSProvider> {
  if (_provider) return _provider;
  const settings = await getSettings();
  _provider = new SileroProvider(settings.sileroBackendUrl);
  return _provider;
}

// Call this after changing backend URL in settings
export function resetProvider(): void {
  _provider = null;
}

export async function ensureFullAudio(lessonId: string): Promise<string | null> {
  const lesson = await getLessonById(lessonId);
  if (!lesson) return null;

  const path = getFullAudioPath(lessonId);
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) return path;

  try {
    const provider = await getProvider();
    await provider.generateFullLessonAudio(lesson, path);
    lesson.audio.full = path;
    lesson.cache.fullAudioSaved = true;
    lesson.cache.audioPending = false;
    await updateLesson(lesson);
    return path;
  } catch (e) {
    console.error('[audioService] generateFullAudio failed:', e);
    return null;
  }
}

export async function ensureLineAudio(lessonId: string, lineIndex: number): Promise<string | null> {
  const lesson = await getLessonById(lessonId);
  if (!lesson || !lesson.lines[lineIndex]) return null;

  const path = getLineAudioPath(lessonId, lineIndex);
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) return path;

  try {
    const provider = await getProvider();
    await provider.generateLineAudio(lesson.lines[lineIndex], lessonId, lineIndex, path);
    lesson.audio.lines[String(lineIndex)] = path;
    lesson.cache.lineAudioCount = Object.keys(lesson.audio.lines).length;
    await updateLesson(lesson);
    return path;
  } catch (e) {
    console.error(`[audioService] generateLineAudio(${lineIndex}) failed:`, e);
    return null;
  }
}

export async function getCachedLineIndices(lessonId: string, lineCount: number): Promise<number[]> {
  const cached: number[] = [];
  for (let i = 0; i < lineCount; i++) {
    const lp = getLineAudioPath(lessonId, i);
    const info = await FileSystem.getInfoAsync(lp);
    if (info.exists) cached.push(i);
  }
  return cached;
}
