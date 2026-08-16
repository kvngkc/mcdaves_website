// src/components/ui/Input.tsx
import React, { forwardRef, useId } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InputType = 'text' | 'email' | 'tel' | 'textarea';
export type InputState = 'default' | 'error' | 'success';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'type'> {
  type?: InputType;
  label?: string;
  helperText?: string;
  state?: InputState;
  /** Replaces helper text when state === 'error' */
  errorMessage?: string;
  /** Replaces helper text when state === 'success' */
  successMessage?: string;
  /** Icon/element placed at the left inside the input */
  leadingAddon?: React.ReactNode;
  /** Icon/element placed at the right inside the input */
  trailingAddon?: React.ReactNode;
  /** Number of rows for textarea (default: 4) */
  rows?: number;
  /** Make the input fill its parent width (default: true) */
  fullWidth?: boolean;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const fieldBase =
  'block w-full rounded-lg border bg-white font-sans text-body-sm text-neutral-800 ' +
  'placeholder:text-neutral-400 ' +
  'transition-all duration-150 ease-in-out ' +
  'focus:outline-none focus:ring-2 focus:ring-offset-0 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50';

const stateRing: Record<InputState, string> = {
  default: 'border-neutral-300 focus:border-brand-500 focus:ring-brand-500/30',
  error:   'border-accent-rose focus:border-accent-rose focus:ring-accent-rose/30',
  success: 'border-green-500   focus:border-green-500   focus:ring-green-500/30',
};

const helperColor: Record<InputState, string> = {
  default: 'text-neutral-500',
  error:   'text-accent-rose',
  success: 'text-green-600',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-4 h-4 text-accent-rose" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Input = forwardRef<
  HTMLInputElement & HTMLTextAreaElement,
  InputProps
>(
  (
    {
      type = 'text',
      label,
      helperText,
      state = 'default',
      errorMessage,
      successMessage,
      leadingAddon,
      trailingAddon,
      rows = 4,
      fullWidth = true,
      id: externalId,
      className = '',
      disabled,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const id = externalId ?? autoId;
    const helperId = `${id}-helper`;

    // Resolve the message shown below the field
    const resolvedHelper =
      state === 'error'
        ? (errorMessage ?? helperText)
        : state === 'success'
        ? (successMessage ?? helperText)
        : helperText;

    // Auto state icon on right
    const stateIcon =
      state === 'success' ? <CheckIcon /> :
      state === 'error'   ? <ErrorIcon /> :
      null;

    const fieldClasses = [
      fieldBase,
      stateRing[state],
      // padding adjusted for addons
      leadingAddon  ? 'pl-10' : 'pl-3.5',
      (trailingAddon || stateIcon) ? 'pr-10' : 'pr-3.5',
      type === 'textarea' ? 'py-3 resize-y' : 'h-11',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const wrapperClasses = fullWidth ? 'w-full' : 'inline-block';

    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClasses}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className="block text-caption font-medium text-neutral-700 leading-none"
          >
            {label}
          </label>
        )}

        {/* Field wrapper with addon slots */}
        <div className="relative">
          {leadingAddon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              {leadingAddon}
            </div>
          )}

          {type === 'textarea' ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={id}
              rows={rows}
              disabled={disabled}
              aria-describedby={resolvedHelper ? helperId : undefined}
              aria-invalid={state === 'error'}
              className={fieldClasses}
              {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              id={id}
              type={type}
              disabled={disabled}
              aria-describedby={resolvedHelper ? helperId : undefined}
              aria-invalid={state === 'error'}
              className={fieldClasses}
              {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          )}

          {(trailingAddon || stateIcon) && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400">
              {stateIcon ?? trailingAddon}
            </div>
          )}
        </div>

        {/* Helper / error / success text */}
        {resolvedHelper && (
          <p
            id={helperId}
            className={`text-caption leading-tight ${helperColor[state]}`}
          >
            {resolvedHelper}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
