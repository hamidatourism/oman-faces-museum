import { useCallback, useEffect, useRef, useState } from 'react';

// Optional licensed track; place an MP3 or OGG file at this path in the public folder to enable it.
const BUNDLED_TRACK_PATH = '/music/ambient.mp3';
const DEFAULT_VOLUME = 0.2;
const DUCKED_VOLUME = 0.08;
const FADE_DURATION_MS = 1200;
const FADE_STEP_MS = 50;
const ERROR_MESSAGE = 'تعذر تشغيل الملف الصوتي. تأكد من أنه ملف MP3 أو OGG سليم.';

export type MusicStatus = 'empty' | 'ready' | 'playing' | 'paused';

async function hasBundledTrack() {
  try {
    const response = await fetch(BUNDLED_TRACK_PATH, { method: 'HEAD' });
    return response.ok && (response.headers.get('content-type') ?? '').startsWith('audio/');
  } catch {
    return false;
  }
}

function cancelFade(timerRef: { current: number | null }) {
  if (timerRef.current !== null) {
    window.clearInterval(timerRef.current);
    timerRef.current = null;
  }
}

function fadeVolume(audio: HTMLAudioElement, target: number, timerRef: { current: number | null }) {
  cancelFade(timerRef);
  const start = audio.volume;
  const steps = FADE_DURATION_MS / FADE_STEP_MS;
  let step = 0;
  timerRef.current = window.setInterval(() => {
    step += 1;
    audio.volume = start + (target - start) * Math.min(step / steps, 1);
    if (step >= steps) cancelFade(timerRef);
  }, FADE_STEP_MS);
}

export function useAmbientMusic(ducked: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<MusicStatus>('empty');
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [error, setError] = useState<string | null>(null);

  const targetVolume = ducked ? Math.min(DUCKED_VOLUME, volume) : volume;

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audioRef.current = audio;

    const handleError = () => {
      setStatus('empty');
      setError(ERROR_MESSAGE);
    };
    audio.addEventListener('error', handleError);

    let cancelled = false;
    hasBundledTrack().then((found) => {
      if (cancelled || !found) return;
      audio.src = BUNDLED_TRACK_PATH;
      setStatus('ready');
    });

    return () => {
      cancelled = true;
      audio.removeEventListener('error', handleError);
      audio.pause();
      cancelFade(fadeTimerRef);
      audio.removeAttribute('src');
      audio.load();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && status === 'playing') fadeVolume(audio, targetVolume, fadeTimerRef);
  }, [status, targetVolume]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio?.src) return;
    setError(null);
    audio.volume = 0;
    audio
      .play()
      .then(() => setStatus('playing'))
      .catch(() => setError('تعذر تشغيل الموسيقى. حاول الضغط على زر التشغيل مرة أخرى.'));
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    cancelFade(fadeTimerRef);
    setStatus('paused');
  }, []);

  const toggle = useCallback(() => {
    if (status === 'playing') pause();
    else play();
  }, [status, pause, play]);

  const start = useCallback(() => {
    if (status === 'ready') play();
  }, [status, play]);

  const loadFile = useCallback((file: File) => {
    const audio = audioRef.current;
    if (!audio) return;
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|ogg)$/i.test(file.name);
    if (!isAudio) {
      setError('اختر ملف MP3 أو OGG.');
      return;
    }
    audio.pause();
    cancelFade(fadeTimerRef);
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const url = URL.createObjectURL(file);
    blobUrlRef.current = url;
    audio.src = url;
    audio.volume = 0;
    setError(null);
    setStatus('ready');
  }, []);

  return { status, volume, error, setVolume, toggle, start, loadFile };
}
