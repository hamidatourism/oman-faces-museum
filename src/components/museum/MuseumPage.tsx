import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, DoorOpen, Landmark, Loader2, RotateCcw } from 'lucide-react';
import { OMANI_FIGURES } from '@/data/omaniFigures';
import BiographyModal from './BiographyModal';
import MuseumErrorBoundary from './MuseumErrorBoundary';
import MuseumScene from './MuseumScene';
import MusicControl from './MusicControl';
import { buildWalkSegment, type Place, type WalkRoute } from './museumPath';
import { toArabicDigits } from './textures';
import { useAmbientMusic } from './useAmbientMusic';

type Stage = 'intro' | 'tour' | 'end';

const FONT_WAIT_LIMIT_MS = 3000;
const LAST_INDEX = OMANI_FIGURES.length - 1;
const OVERLAY_BUTTON =
  'inline-flex items-center gap-3 rounded-full bg-[#c9a24d] px-8 py-3.5 text-base font-semibold text-[#1d1610] shadow-lg shadow-black/40 transition hover:bg-[#dcb866] hover:gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f3e9d2] disabled:opacity-50';
const GHOST_BUTTON =
  'inline-flex items-center gap-2 rounded-full border border-[#c9a24d]/60 bg-black/40 px-5 py-2.5 text-sm text-[#f3e9d2] backdrop-blur transition hover:bg-[#c9a24d]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e7c27a] disabled:cursor-not-allowed disabled:opacity-35';

export default function MuseumPage() {
  const [fontsReady, setFontsReady] = useState(false);
  const [stage, setStage] = useState<Stage>('intro');
  const [position, setPosition] = useState<Place>(null);
  const [route, setRoute] = useState<WalkRoute | null>(null);
  const [isBiographyOpen, setIsBiographyOpen] = useState(false);
  const music = useAmbientMusic(isBiographyOpen);

  const reduceMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const segment = useMemo(
    () => (route ? buildWalkSegment(route, reduceMotion) : null),
    [route, reduceMotion],
  );

  useEffect(() => {
    let active = true;
    const fontsLoaded = Promise.all([
      document.fonts.load("700 64px 'Amiri'"),
      document.fonts.load("600 24px 'Cairo'"),
    ]).catch(() => undefined);
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, FONT_WAIT_LIMIT_MS));
    Promise.race([fontsLoaded, timeout]).then(() => {
      if (active) setFontsReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleArrive = useCallback(() => {
    if (!route) return;
    setPosition(route.to);
    setRoute(null);
    if (route.to === null) setStage('intro');
  }, [route]);

  const isMoving = route !== null;
  const targetPlace: Place = route ? route.to : position;
  const canInteract = stage === 'tour' && !isMoving;
  const interactiveIndex = canInteract ? position : null;
  const modalFigure = position !== null ? OMANI_FIGURES[position] : null;

  const startRoute = (to: Place) => {
    if (route) return;
    setIsBiographyOpen(false);
    setStage('tour');
    setRoute({ from: position, to });
  };

  const finishTour = () => {
    setIsBiographyOpen(false);
    setStage('end');
  };

  const enterMuseum = () => {
    music.start();
    startRoute(0);
  };

  const handleNext = () => {
    if (position === null) return;
    if (position === LAST_INDEX) finishTour();
    else startRoute(position + 1);
  };

  const handlePrevious = () => {
    if (position === null || position === 0) return;
    startRoute(position - 1);
  };

  const returnToEntrance = () => {
    if (position === null) return;
    startRoute(null);
  };

  const openPainting = (paintingIndex: number) => {
    if (canInteract && paintingIndex === position) setIsBiographyOpen(true);
  };

  if (!fontsReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#120d08]">
        <div className="flex flex-col items-center gap-4 text-[#f3e9d2]" dir="rtl">
          <Loader2 className="h-8 w-8 animate-spin text-[#d6ae5e]" aria-hidden="true" />
          <p className="font-['Cairo',sans-serif] text-sm">جارٍ تجهيز المعرض…</p>
        </div>
      </div>
    );
  }

  const progressLabel =
    targetPlace === null
      ? 'المدخل'
      : `اللوحة ${toArabicDigits(targetPlace + 1)} من ${toArabicDigits(OMANI_FIGURES.length)}`;
  const hintLabel = isMoving
    ? targetPlace === null
      ? 'جارٍ العودة إلى مدخل المعرض…'
      : 'جارٍ المشي نحو اللوحة…'
    : 'انقر على اللوحة لقراءة سيرتها';

  return (
    <main dir="rtl" lang="ar" className="fixed inset-0 overflow-hidden bg-[#120d08] font-['Cairo',sans-serif] text-[#f3e9d2]">
      <MuseumErrorBoundary>
        <MuseumScene
          segment={segment}
          interactiveIndex={interactiveIndex}
          onArrive={handleArrive}
          onSelectPainting={openPainting}
        />
      </MuseumErrorBoundary>

      {stage === 'intro' && (
        <section className="museum-fade-in pointer-events-none fixed inset-0 flex flex-col items-center justify-between bg-gradient-to-b from-black/70 via-black/35 to-black/85 px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a24d]/50 bg-black/40 px-4 py-2 text-sm text-[#e7c27a] backdrop-blur">
            <Landmark className="h-4 w-4" aria-hidden="true" />
            <span>سراج عُمان | رحلة المعرفة</span>
          </div>
          <div className="pointer-events-auto max-w-2xl">
            <h1 className="font-['Amiri',serif] text-5xl font-bold leading-[1.2] text-white drop-shadow-lg sm:text-7xl">
              وجوه من عُمان
            </h1>
            <p className="mt-4 font-['Amiri',serif] text-2xl font-semibold text-white sm:text-3xl">
              مدرسة لزق للصفوف (١–٨)
            </p>
            <p className="mt-2 text-sm text-[#e7c27a] sm:text-base">إشراف: حميدة القنوبي</p>
            <p className="mt-5 font-['Amiri',serif] text-xl text-[#e7c27a] sm:text-2xl">
              سبع شخصيات... وحكايات خلدها التاريخ
            </p>
            <button type="button" onClick={enterMuseum} className={`${OVERLAY_BUTTON} mt-10`}>
              ادخل المعرض
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="pointer-events-none">
            <MusicControl
              status={music.status}
              volume={music.volume}
              error={music.error}
              onToggle={music.toggle}
              onVolumeChange={music.setVolume}
              onFileSelected={music.loadFile}
            />
          </div>
        </section>
      )}

      {stage === 'tour' && !isBiographyOpen && (
        <>
          <header className="pointer-events-none fixed inset-x-0 top-0 flex items-start justify-between gap-4 p-4 sm:p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c9a24d]/50 bg-black/45 px-4 py-2 text-xs text-[#e7c27a] backdrop-blur sm:text-sm">
              <Landmark className="h-4 w-4" aria-hidden="true" />
              <span>سراج عُمان | رحلة المعرفة</span>
            </div>
            <p className="rounded-full bg-black/45 px-4 py-2 text-xs text-[#f3e9d2] backdrop-blur sm:text-sm">
              {progressLabel}
            </p>
          </header>

          <footer className="pointer-events-none fixed inset-x-0 bottom-0 flex flex-col items-center gap-3 p-4 sm:p-6">
            <MusicControl
              status={music.status}
              volume={music.volume}
              error={music.error}
              onToggle={music.toggle}
              onVolumeChange={music.setVolume}
              onFileSelected={music.loadFile}
            />
            <p className="rounded-full bg-black/55 px-5 py-2 text-center text-sm text-[#f3e9d2] backdrop-blur">
              {hintLabel}
            </p>
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isMoving || position === null || position === 0}
                className={GHOST_BUTTON}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                السابق
              </button>
              <button
                type="button"
                onClick={returnToEntrance}
                disabled={isMoving || position === null}
                className={GHOST_BUTTON}
              >
                <DoorOpen className="h-4 w-4" aria-hidden="true" />
                العودة للمدخل
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={isMoving || position === null}
                className={GHOST_BUTTON}
              >
                {position === LAST_INDEX ? 'إنهاء الجولة' : 'التالي'}
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="rounded-full bg-black/45 px-4 py-1.5 text-center text-xs text-[#e7c27a] backdrop-blur">
              مدرسة لزق للصفوف (١–٨) · إشراف: حميدة القنوبي
            </p>
          </footer>
        </>
      )}

      {stage === 'end' && (
        <section className="museum-fade-in fixed inset-0 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="museum-modal-in w-full max-w-md rounded-3xl border border-[#c9a24d]/40 bg-[#1d1610] p-8 text-center shadow-2xl">
            <h2 className="font-['Amiri',serif] text-3xl font-bold text-white">انتهت الجولة</h2>
            <p className="mt-3 text-[#e7c27a]">شكرًا لزيارتك معرض وجوه من عُمان.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => startRoute(0)} className={OVERLAY_BUTTON}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                إعادة الجولة
              </button>
              <a href="/" className={GHOST_BUTTON}>
                العودة إلى سراج عُمان
              </a>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-6 flex justify-center px-4">
            <MusicControl
              status={music.status}
              volume={music.volume}
              error={music.error}
              onToggle={music.toggle}
              onVolumeChange={music.setVolume}
              onFileSelected={music.loadFile}
            />
          </div>
        </section>
      )}

      {isBiographyOpen && modalFigure && position !== null && (
        <BiographyModal
          figure={modalFigure}
          number={position + 1}
          total={OMANI_FIGURES.length}
          onClose={() => setIsBiographyOpen(false)}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
    </main>
  );
}
