import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { LANGUAGES } from '../../i18n/languages';

interface LanguageSwitcherProps {
  /** `dropdown` is a compact button with a menu; `segmented` shows all three choices in a row. */
  variant?: 'dropdown' | 'segmented';
  className?: string;
}

const triggerClass =
  'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 shadow-2xs transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#861F31]';

/**
 * Language choice for visitors: English, Tamil or Sinhala. The names are always shown in
 * their own script and are marked data-no-translate so they are never translated.
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'dropdown', className = '' }) => {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const current = LANGUAGES.find((option) => option.code === lang) ?? LANGUAGES[0];

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    // Move focus into the menu: onto the selected language.
    rootRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, close]);

  const choose = (code: (typeof LANGUAGES)[number]['code']) => {
    setLang(code);
    close(true);
  };

  if (variant === 'segmented') {
    return (
      <div
        data-no-translate
        role="radiogroup"
        aria-label="Language"
        className={`grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1 ${className}`}
      >
        {LANGUAGES.map((option) => (
          <button
            key={option.code}
            type="button"
            role="radio"
            aria-checked={option.code === lang}
            lang={option.htmlLang}
            onClick={() => setLang(option.code)}
            className={`rounded-lg px-2 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#861F31] ${
              option.code === lang ? 'bg-[#861F31] text-white' : 'text-slate-800 hover:bg-blue-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === 'Tab') return close(false);
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    const move: Record<string, number> = {
      ArrowDown: (index + 1) % items.length,
      ArrowUp: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    };
    if (event.key in move) {
      event.preventDefault();
      items[move[event.key]]?.focus();
    }
  };

  return (
    <div ref={rootRef} data-no-translate className={`relative ${className}`} onKeyDown={open ? onMenuKeyDown : undefined}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Language: ${current.label}`}
        title="Language"
        className={triggerClass}
      >
        <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span lang={current.htmlLang}>{current.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Language"
          className="absolute right-0 z-[80] mt-2 min-w-[9rem] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10"
        >
          {LANGUAGES.map((option) => (
            <button
              key={option.code}
              type="button"
              role="menuitemradio"
              aria-checked={option.code === lang}
              lang={option.htmlLang}
              onClick={() => choose(option.code)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none"
            >
              {option.label}
              {option.code === lang && <Check className="h-4 w-4 text-[#861F31]" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
