import { useRef, type ChangeEvent } from 'react';
import { Music, Pause, Play, Upload, Volume2 } from 'lucide-react';
import { toArabicDigits } from './textures';
import type { MusicStatus } from './useAmbientMusic';

interface MusicControlProps {
  status: MusicStatus;
  volume: number;
  error: string | null;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onFileSelected: (file: File) => void;
}

const PILL =
  'pointer-events-auto inline-flex flex-wrap items-center justify-center gap-3 rounded-full border border-[#c9a24d]/50 bg-black/55 px-4 py-2 text-xs text-[#f3e9d2] backdrop-blur sm:text-sm';
const ICON_BUTTON =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#c9a24d]/60 text-[#e7c27a] transition hover:bg-[#c9a24d]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e7c27a]';

export default function MusicControl({
  status,
  volume,
  error,
  onToggle,
  onVolumeChange,
  onFileSelected,
}: MusicControlProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const percent = Math.round(volume * 100);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelected(file);
    event.target.value = '';
  };

  return (
    <div className={PILL} role="group" aria-label="موسيقى المعرض">
      <Music className="h-4 w-4 text-[#e7c27a]" aria-hidden="true" />
      {status === 'empty' ? (
        <span>لم تُضف موسيقى بعد</span>
      ) : (
        <>
          <button
            type="button"
            onClick={onToggle}
            className={ICON_BUTTON}
            aria-label={status === 'playing' ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
          >
            {status === 'playing' ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <label className="inline-flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-[#e7c27a]" aria-hidden="true" />
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={percent}
              onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
              aria-label="مستوى صوت الموسيقى"
              className="w-24 accent-[#c9a24d]"
            />
          </label>
          <span className="w-10 text-center tabular-nums">{toArabicDigits(percent)}٪</span>
        </>
      )}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={ICON_BUTTON}
        aria-label="رفع ملف موسيقى"
        title="رفع ملف MP3 أو OGG"
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/ogg,.mp3,.ogg"
        className="hidden"
        onChange={handleFile}
      />
      {error && <span className="basis-full text-center text-[#f0b4a8]">{error}</span>}
    </div>
  );
}
