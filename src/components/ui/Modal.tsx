// src/components/ui/Modal.tsx
'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  useId,
  Fragment,
} from 'react';
import { createPortal } from 'react-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** Controls visibility */
  open: boolean;
  /** Called when the user requests to close (backdrop click, Escape, close button) */
  onClose: () => void;
  /** Title shown in the modal header */
  title?: React.ReactNode;
  /** Optional description / subtitle */
  description?: React.ReactNode;
  /** Main body content */
  children: React.ReactNode;
  /** Footer content (e.g. action buttons) */
  footer?: React.ReactNode;
  size?: ModalSize;
  /** Prevent closing by clicking the backdrop */
  disableBackdropClose?: boolean;
  /** Prevent closing with the Escape key */
  disableEscClose?: boolean;
  /** Hide the default close (×) button in the header */
  hideCloseButton?: boolean;
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<ModalSize, string> = {
  sm:   'max-w-sm w-full',
  md:   'max-w-lg w-full',
  lg:   'max-w-3xl w-full',
  xl:   'max-w-5xl w-full',
  full: 'w-screen h-screen max-w-none rounded-none',
};

// ─── Focusable selector ───────────────────────────────────────────────────────

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), ' +
  'input:not([disabled]), select:not([disabled]), ' +
  '[tabindex]:not([tabindex="-1"])';

// ─── Focus trap hook ──────────────────────────────────────────────────────────

function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !ref.current) return;

    const el = ref.current;

    // Remember what was focused before the modal opened so we can restore it
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus inside the modal
    const firstFocusable = el.querySelectorAll<HTMLElement>(FOCUSABLE)[0];
    firstFocusable?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    el.addEventListener('keydown', handleKeyDown);

    return () => {
      el.removeEventListener('keydown', handleKeyDown);
      // Restore focus when modal closes
      previouslyFocused?.focus?.();
    };
  }, [active, ref]);
}

// ─── Body scroll lock ─────────────────────────────────────────────────────────

function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [active]);
}

// ─── Close icon ───────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  disableBackdropClose = false,
  disableEscClose = false,
  hideCloseButton = false,
  className = '',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId  = useId();

  // Focus trap & scroll lock
  useFocusTrap(dialogRef, open);
  useScrollLock(open);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!disableEscClose && e.key === 'Escape') onClose();
    },
    [disableEscClose, onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  // Backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!disableBackdropClose && e.target === e.currentTarget) onClose();
    },
    [disableBackdropClose, onClose],
  );

  if (!open) return null;

  const isFullSize = size === 'full';

  const dialog = (
    <Fragment>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[70] bg-neutral-900/60 backdrop-blur-sm"
        aria-hidden="true"
        style={{ animation: 'fadeIn 150ms ease' }}
      />

      {/* ── Scroll container ─────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={
          isFullSize
            ? 'fixed inset-0 z-[70] flex items-stretch justify-stretch overflow-hidden'
            : 'fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 overflow-y-auto'
        }
        onClick={handleBackdropClick}
      >
        {/* ── Panel ──────────────────────────────────────────────────────── */}
        <div
          ref={dialogRef}
          tabIndex={-1}
          className={[
            'relative flex flex-col bg-white outline-none z-[80]',
            // max-h caps the panel at viewport height minus breathing room;
            // overflow-y-auto lets the body scroll if content overflows.
            // The close button sits in the sticky header div above the body
            // — no z-index conflict possible.
            isFullSize ? 'flex-1 overflow-hidden' : 'rounded-xl shadow-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto',
            sizeMap[size],
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ animation: 'slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          {(title || !hideCloseButton) && (
            <div
              className={`flex items-start gap-3 px-4 sm:px-6 ${
                description ? 'pt-5 pb-2 sm:pt-6' : 'py-4 sm:py-5'
              } border-b border-neutral-100`}
            >
              <div className="flex-1 min-w-0">
                {title && (
                  <h2
                    id={titleId}
                    className="text-h4 text-neutral-900 leading-snug"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id={descId}
                    className="mt-1 text-caption text-neutral-500"
                  >
                    {description}
                  </p>
                )}
              </div>

              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className={
                    'flex-shrink-0 p-2 rounded-lg text-neutral-400 min-h-[44px] min-w-[44px] flex items-center justify-center ' +
                    'hover:text-neutral-700 hover:bg-neutral-100 ' +
                    'transition-colors duration-150 ' +
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
                  }
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          )}

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div
            className={`flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 ${
              isFullSize ? 'min-h-0' : ''
            }`}
          >
            {children}
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          {footer && (
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-neutral-100 bg-neutral-50/60">
              {footer}
            </div>
          )}
        </div>
      </div>

      {/* ── Keyframe animations (injected once via a style tag) ───────────── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </Fragment>
  );

  // Render into <body> via a portal so stacking contexts are never an issue
  return typeof document !== 'undefined'
    ? createPortal(dialog, document.body)
    : null;
}

export default Modal;
