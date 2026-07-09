import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className = '', id, ...props },
  ref,
) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm text-text-muted">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={3}
        className={`w-full resize-none rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
});
