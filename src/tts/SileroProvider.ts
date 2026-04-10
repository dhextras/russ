import { TTSProvider } from './TTSProvider';
import { Lesson, LessonLine } from '../types/lesson';
import { downloadAudioToPath } from '../services/storage';

// See: https://github.com/snakers4/silero-models
// Backend must expose: GET /health, POST /tts/line, POST /tts/lesson

function makeSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export class SileroProvider implements TTSProvider {
  constructor(private backendUrl: string) {}

  getProviderName(): string {
    return 'Silero';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.backendUrl) return false;
    try {
      const res = await fetch(`${this.backendUrl}/health`, {
        signal: makeSignal(4000),
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
      signal: makeSignal(120_000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string };
      throw new Error(`/tts/lesson ${res.status}: ${err.detail ?? 'unknown error'}`);
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
      signal: makeSignal(30_000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string };
      throw new Error(`/tts/line ${res.status}: ${err.detail ?? 'unknown error'}`);
    }

    const data = (await res.json()) as { url?: string };
    if (!data.url) throw new Error('Silero response missing url field');

    await downloadAudioToPath(data.url, destPath);
  }
}
