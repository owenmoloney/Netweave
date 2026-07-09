import { X } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';

const typeStyles = {
  error: 'border-danger/30 bg-danger/10 text-danger',
  success: 'border-success/30 bg-success/10 text-success',
  info: 'border-accent/30 bg-accent/10 text-text-primary',
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-xl backdrop-blur-sm ${typeStyles[toast.type]}`}
        >
          <p className="flex-1">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
