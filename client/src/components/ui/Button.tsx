import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

const variants = {
  primary: 'bg-accent text-white hover:opacity-90',
  secondary: 'bg-surface-elevated text-text-primary border border-white/10 hover:bg-white/5',
  danger: 'bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30',
  ghost: 'text-text-muted hover:text-text-primary hover:bg-white/5',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
