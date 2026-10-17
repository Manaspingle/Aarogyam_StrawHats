import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X, AlertCircle } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'teal' | 'orange' | 'danger' | 'danger-subtle' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-teal text-white hover:bg-brand-teal/90 active:bg-brand-teal/95 shadow-sm focus:ring-brand-teal/40 border border-transparent font-bold',
  secondary:
    'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-sm focus:ring-slate-600 border border-transparent font-bold',
  outline:
    'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white shadow-sm focus:ring-brand-teal/30 font-bold',
  teal:
    'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-sm focus:ring-teal-500 border border-transparent font-bold',
  orange:
    'bg-brand-orange text-white hover:bg-brand-orange/90 active:bg-brand-orange/95 shadow-sm focus:ring-brand-orange/40 border border-transparent font-bold',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm focus:ring-red-500 border border-transparent font-bold',
  'danger-subtle':
    'border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 font-bold',
  ghost:
    'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus:ring-slate-300 font-bold',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
  sm: 'px-3 py-1.5 text-xs font-bold rounded-xl gap-1.5',
  md: 'px-4 py-2 text-sm font-bold rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base font-bold rounded-2xl gap-2.5',
};

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  fullWidth,
  loading = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99]',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading && <Spinner className="h-4 w-4 shrink-0 text-current mr-2" />}
      {children}
    </button>
  );
}

type InputProps = {
  label?: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  className?: string;
  icon?: ReactNode;
  error?: string;
  helper?: string;
  autoComplete?: string;
};

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  min,
  max,
  className,
  icon,
  error,
  helper,
  autoComplete,
}: InputProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <span>
            {label} {required && <span className="text-red-500 font-bold">*</span>}
          </span>
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          autoComplete={autoComplete}
          className={cn(
            'w-full rounded-xl border bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-xs transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal',
            error
              ? 'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
            icon && 'pl-9',
          )}
        />
      </div>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-600 font-medium">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      {!error && helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

type SelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  error?: string;
};

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  className,
  error,
}: SelectProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={cn(
          'w-full rounded-xl border bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 shadow-xs transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal cursor-pointer',
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm transition-all',
        className,
      )}
    >
      {children}
    </div>
  );
}

export type BadgeVariant = 'gray' | 'red' | 'green' | 'blue' | 'yellow' | 'teal' | 'orange' | 'amber';

export function Badge({
  children,
  variant = 'gray',
  dot = false,
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}) {
  const variantStyles: Record<BadgeVariant, string> = {
    gray: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    red: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    green: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    blue: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    yellow: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    teal: 'bg-teal-50 dark:bg-teal-950/60 text-brand-teal dark:text-teal-300 border-brand-teal/20',
    orange: 'bg-orange-50 dark:bg-orange-950/60 text-brand-orange dark:text-orange-300 border-brand-orange/20',
    amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  };

  const dotColors: Record<BadgeVariant, string> = {
    gray: 'bg-slate-400',
    red: 'bg-red-500',
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
    yellow: 'bg-amber-500',
    teal: 'bg-brand-teal',
    orange: 'bg-brand-orange',
    amber: 'bg-amber-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border',
        variantStyles[variant],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className={cn('relative w-full rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 max-h-[90vh] overflow-y-auto', maxWidth)}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{title}</h3>
            {description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-3">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800', className)} />;
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin h-5 w-5', className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
