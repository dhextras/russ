import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getAllLessons, createLessonFromImport } from './storage';
import { validateLessonJSON } from './lessonValidator';

export async function exportAllLessons(): Promise<void> {
  const lessons = await getAllLessons();

  // Export only the content — local audio URIs are device-specific and excluded
  const exportable = lessons.map((l) => ({
    title: l.title,
    description: l.description,
    tags: l.tags,
    lines: l.lines,
  }));

  const path = `${FileSystem.cacheDirectory}russian-lessons-export.json`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(exportable, null, 2));

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device');

  await Sharing.shareAsync(path, {
    mimeType: 'application/json',
    dialogTitle: 'Export Russian Lessons',
  });
}

export interface ImportAllResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function importAllLessonsFromFile(): Promise<ImportAllResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) return null;

  const file = result.assets[0];
  let raw: string;
  try {
    raw = await FileSystem.readAsStringAsync(file.uri);
  } catch {
    return { imported: 0, skipped: 0, errors: ['Could not read selected file'] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { imported: 0, skipped: 0, errors: ['File is not valid JSON'] };
  }

  if (!Array.isArray(parsed)) {
    return { imported: 0, skipped: 0, errors: ['Expected a JSON array of lessons'] };
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const validation = validateLessonJSON(JSON.stringify(parsed[i]));
    if (!validation.valid || !validation.lesson) {
      errors.push(`Lesson ${i + 1}: ${validation.errors.join('; ')}`);
      skipped++;
      continue;
    }
    try {
      await createLessonFromImport(validation.lesson);
      imported++;
    } catch {
      errors.push(`Lesson ${i + 1}: failed to save`);
      skipped++;
    }
  }

  return { imported, skipped, errors };
}
