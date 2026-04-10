import { TTSProvider } from './TTSProvider';
import { Lesson, LessonLine } from '../types/lesson';
import { downloadAudioToPath } from '../services/storage';

// STUB — wire up a real backend that runs Silero and exposes these endpoints:
//
//   GET  /health              -> 200 OK when service is up
//   POST /tts/line            -> body: { text: string }
//                               response: { url: string }  (URL to generated mp3)
//   POST /tts/lesson          -> body: { lines: string[] }
//                               response: { url: string }
//
// Silero handles Russian stress and homograph disambiguation automatically.
// See: https://github.com/snakers4/silero-models
//      https://github.com/snakers4/silero-stress

export class SileroProvider implements TTSProvider {
  constructor(private backendUrl: string) {}

  getProviderName(): string {
    return 'Silero';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.backendUrl) return false;
    try {
      const res = await fetch(`${this.backendUrl}/health`, {
        signal: AbortSignal.timeout(4000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async generateFullLessonAudio(lesson: Lesson, destPath: string): Promise<void> {
    const res = await fetch(`${this.backendUrl}/tts/lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: lesson.lines.map((l) => l.ru) }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      throw new Error(`Silero /tts/lesson failed: HTTP ${res.status}`);
    }

    const data = (await res.json()) as { url?: string };
    if (!data.url) throw new Error('Silero response missing url field');

    await downloadAudioToPath(data.url, destPath);
  }

  async generateLineAudio(
    line: LessonLine,
    _lessonId: string,
    _lineIndex: number,
    destPath: string
  ): Promise<void> {
    const res = await fetch(`${this.backendUrl}/tts/line`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: line.ru }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      throw new Error(`Silero /tts/line failed: HTTP ${res.status}`);
    }

    const data = (await res.json()) as { url?: string };
    if (!data.url) throw new Error('Silero response missing url field');

    await downloadAudioToPath(data.url, destPath);
  }
}
