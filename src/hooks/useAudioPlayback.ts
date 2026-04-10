import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Lesson } from '../types/lesson';
import { ensureLineAudio, getCachedLineIndices } from '../services/audioService';
import { getLineAudioPath } from '../services/storage';

type PlayState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface DownloadProgress {
  done: number;
  total: number;
}

export function useAudioPlayback(lesson: Lesson | null, isOnline: boolean) {
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [currentLineIdx, setCurrentLineIdx] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const isDownloadingRef = useRef(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const queueRef = useRef<number[]>([]);
  const lineModeRef = useRef(false);

  // Keep latest values in refs so async callbacks never go stale
  const lessonRef = useRef(lesson);
  const isOnlineRef = useRef(isOnline);
  lessonRef.current = lesson;
  isOnlineRef.current = isOnline;

  // Stable ref to advanceQueue so onPlaybackStatusUpdate can call it
  const advanceQueueRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  async function unloadCurrent() {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  }

  function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
    if (!status.isLoaded) return;
    if (status.didJustFinish && lineModeRef.current) {
      advanceQueueRef.current();
    }
  }

  async function loadAndPlay(uri: string) {
    await unloadCurrent();
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true }
    );
    sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    soundRef.current = sound;
    setPlayState('playing');
  }

  async function resolveLineAudio(lessonId: string, lineIdx: number): Promise<string | null> {
    const path = getLineAudioPath(lessonId, lineIdx);
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) return path;
    if (isOnlineRef.current) return ensureLineAudio(lessonId, lineIdx);
    return null;
  }

  const advanceQueue = useCallback(async () => {
    const lesson = lessonRef.current;
    if (!lesson || !lineModeRef.current) return;

    if (queueRef.current.length === 0) {
      lineModeRef.current = false;
      setPlayState('idle');
      setCurrentLineIdx(null);
      return;
    }

    const idx = queueRef.current.shift()!;
    setCurrentLineIdx(idx);
    setPlayState('loading');

    const path = await resolveLineAudio(lesson.id, idx);
    if (path) {
      await loadAndPlay(path);
    } else if (queueRef.current.length > 0) {
      // No audio for this line, skip it
      await advanceQueueRef.current();
    } else {
      lineModeRef.current = false;
      setPlayState('idle');
      setCurrentLineIdx(null);
    }
  }, []);

  // Keep the ref in sync
  advanceQueueRef.current = advanceQueue;

  const startLineQueue = useCallback(
    async (fromIdx: number, allowedIndices?: number[]) => {
      const lesson = lessonRef.current;
      if (!lesson) return;
      const pool = allowedIndices ?? lesson.lines.map((_, i) => i);
      queueRef.current = pool.filter((i) => i >= fromIdx);
      lineModeRef.current = true;
      await advanceQueue();
    },
    [advanceQueue]
  );

  const playFull = useCallback(async () => {
    const lesson = lessonRef.current;
    if (!lesson) return;
    setErrorMsg(null);
    await unloadCurrent();

    // Always play line-by-line so currentLineIdx tracks which line is playing
    if (isOnlineRef.current) {
      // Online: fetch any missing lines on-demand as the queue advances
      await startLineQueue(0);
    } else {
      // Offline: only play what's already cached
      const cachedIndices = await getCachedLineIndices(lesson.id, lesson.lines.length);
      if (cachedIndices.length > 0) {
        await startLineQueue(0, cachedIndices);
      } else {
        setPlayState('error');
        setErrorMsg('No cached audio. Go online or download first.');
      }
    }
  }, [startLineQueue]);

  const downloadAll = useCallback(async () => {
    const lesson = lessonRef.current;
    if (!lesson || !isOnlineRef.current || isDownloadingRef.current) return;
    isDownloadingRef.current = true;
    const total = lesson.lines.length;
    setDownloadProgress({ done: 0, total });
    for (let i = 0; i < total; i++) {
      await ensureLineAudio(lesson.id, i);
      setDownloadProgress({ done: i + 1, total });
    }
    isDownloadingRef.current = false;
    setDownloadProgress(null);
  }, []);

  const playFromLine = useCallback(
    async (lineIdx: number) => {
      if (!lessonRef.current) return;
      setErrorMsg(null);
      await unloadCurrent();
      await startLineQueue(lineIdx);
    },
    [startLineQueue]
  );

  const playSingleLine = useCallback(async (lineIdx: number) => {
    const lesson = lessonRef.current;
    if (!lesson) return;
    setErrorMsg(null);
    lineModeRef.current = false;
    queueRef.current = [];
    setCurrentLineIdx(lineIdx);
    setPlayState('loading');
    await unloadCurrent();

    const path = await resolveLineAudio(lesson.id, lineIdx);
    if (path) {
      await loadAndPlay(path);
    } else {
      setPlayState('error');
      setErrorMsg(
        isOnlineRef.current
          ? `Audio generation for line ${lineIdx + 1} failed.`
          : `Line ${lineIdx + 1} has no cached audio.`
      );
    }
  }, []);

  const pause = useCallback(async () => {
    await soundRef.current?.pauseAsync();
    setPlayState('paused');
  }, []);

  const resume = useCallback(async () => {
    await soundRef.current?.playAsync();
    setPlayState('playing');
  }, []);

  const stop = useCallback(async () => {
    lineModeRef.current = false;
    queueRef.current = [];
    await unloadCurrent();
    setPlayState('idle');
    setCurrentLineIdx(null);
    setErrorMsg(null);
  }, []);

  return {
    playState,
    currentLineIdx,
    errorMsg,
    downloadProgress,
    isPlaying: playState === 'playing',
    isPaused: playState === 'paused',
    isLoading: playState === 'loading',
    isDownloading: isDownloadingRef.current,
    playFull,
    playFromLine,
    playSingleLine,
    downloadAll,
    pause,
    resume,
    stop,
  };
}
