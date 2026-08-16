// src/components/ui/Button.tsx
import React, { forwardRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'whatsapp'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Renders a full-width block button */
  fullWidth?: boolean;
  /** Icon placed before the label */
  leadingIcon?: React.ReactNode;
  /** Icon placed after the label */
  trailingIcon?: React.ReactNode;
  children: React.ReactNode;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg ' +
  'transition-all duration-200 ease-in-out focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'active:scale-[0.97] select-none';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm ' +
    'hover:bg-brand-700 active:bg-brand-800 ' +
    'focus-visible:ring-brand-500',

  secondary:
    'bg-white text-brand-700 border border-brand-300 shadow-sm ' +
    'hover:bg-brand-50 hover:border-brand-500 active:bg-brand-100 ' +
    'focus-visible:ring-brand-500',

  tertiary:
    'bg-transparent text-brand-700 ' +
    'hover:bg-brand-50 active:bg-brand-100 ' +
    'focus-visible:ring-brand-500',

  whatsapp:
    'bg-[#25D366] text-white shadow-sm ' +
    'hover:bg-[#1ebe5d] active:bg-[#17a852] ' +
    'focus-visible:ring-[#25D366]',

  danger:
    'bg-accent-rose text-white shadow-sm ' +
    'hover:bg-rose-700 active:bg-rose-800 ' +
    'focus-visible:ring-accent-rose',
};

const sizeStyles: Record<ButtonSize, string> = {
  // min-h-[44px] on all sizes — WCAG 2.5.5 touch-target minimum (no exceptions).
  // Icon-only buttons must additionally carry min-w-[44px] at the call site.
  sm: 'min-h-[44px] px-3 text-sm',
  md: 'min-h-[44px] px-5 text-body-sm',
  lg: 'min-h-[44px] px-7 text-body',
};

const iconSizes: Record<ButtonSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-5 h-5',
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ''}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leadingIcon,
      trailingIcon,
      disabled,
      className = '',
      children,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={[
          base,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {loading ? (
          <Spinner className={iconSizes[size]} />
        ) : (
          leadingIcon && (
            <span className={`flex-shrink-0 ${iconSizes[size]}`} aria-hidden="true">
              {leadingIcon}
            </span>
          )
        )}

        <span className={loading ? 'opacity-70' : ''}>{children}</span>

        {!loading && trailingIcon && (
          <span className={`flex-shrink-0 ${iconSizes[size]}`} aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
