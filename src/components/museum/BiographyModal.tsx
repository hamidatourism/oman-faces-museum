import { Fragment, useEffect, type ReactNode } from 'react';
import type { BioBlock, OmaniFigure } from '@/data/omaniFigures';
import { toArabicDigits } from './textures';

interface BiographyModalProps {
  figure: OmaniFigure;
  number: number;
  total: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

const SECONDARY_BUTTON =
  'rounded-full border border-[#c9a24d]/50 px-5 py-2.5 text-sm text-[#f3e9d2] transition hover:bg-[#c9a24d]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e7c27a] disabled:cursor-not-allowed disabled:opacity-40';
const PRIMARY_BUTTON =
  'rounded-full bg-[#c9a24d] px-5 py-2.5 text-sm font-semibold text-[#1d1610] transition hover:bg-[#dcb866] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f3e9d2]';

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*.+?\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index} className="font-bold text-[#e7c27a]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

function renderBlock(block: BioBlock, key: number) {
  if (block.type === 'paragraph') {
    return (
      <p key={key} className="text-[1.0625rem] leading-[1.9] text-[#f3e9d2] sm:text-[1.125rem]">
        {renderInline(block.text)}
      </p>
    );
  }
  return (
    <div key={key} className="rounded-2xl border-r-2 border-[#c9a24d] bg-white/5 px-6 py-5">
      {block.stanzas.map((stanza, stanzaIndex) => (
        <div key={stanzaIndex} className={stanzaIndex > 0 ? 'mt-4' : undefined}>
          {stanza.map((line) => (
            <p key={line} className="text-[1.0625rem] leading-[2] text-[#f3e9d2]">
              {line}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function BiographyModal({
  figure,
  number,
  total,
  onClose,
  onPrevious,
  onNext,
}: BiographyModalProps) {
  const isFirst = number === 1;
  const isLast = number === total;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="museum-fade-in fixed inset-0 z-40 flex items-end justify-center bg-stone-950/75 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="biography-title"
        dir="rtl"
        lang="ar"
        onClick={(event) => event.stopPropagation()}
        className="museum-modal-in flex max-h-[88dvh] w-full max-w-2xl flex-col rounded-t-3xl border border-[#c9a24d]/40 bg-[#1d1610] shadow-2xl sm:max-h-[85vh] sm:rounded-3xl"
      >
        <header className="border-b border-[#c9a24d]/25 px-6 pb-5 pt-6 sm:px-8">
          <p className="text-sm text-[#e7c27a]">
            اللوحة {toArabicDigits(number)} من {toArabicDigits(total)}
          </p>
          <h2
            id="biography-title"
            className="mt-2 font-['Amiri',serif] text-2xl font-bold leading-[1.3] text-white sm:text-3xl"
          >
            {figure.name}
          </h2>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8">
          {figure.blocks.map(renderBlock)}
          <p className="border-t border-[#c9a24d]/30 pt-4 text-sm leading-[1.8] text-[#e7c27a]">
            <span className="font-bold">المصدر:</span> {figure.source}
          </p>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[#c9a24d]/25 px-6 py-4 sm:px-8">
          <button type="button" onClick={onPrevious} disabled={isFirst} className={SECONDARY_BUTTON}>
            السابق
          </button>
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
            إغلاق
          </button>
          <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
            {isLast ? 'إنهاء الجولة' : 'التالي'}
          </button>
        </footer>
      </div>
    </div>
  );
}
