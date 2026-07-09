import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  isOverlay?: boolean;
}

export function Drawer({ open, onClose, title, children, isOverlay = false }: DrawerProps) {
  return (
    <>
      {open && isOverlay && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {open && !isOverlay && (
        <div
          className="fixed inset-0 z-40 hidden bg-black/30 md:block"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full flex-col border-l border-white/10 bg-surface shadow-2xl transition-transform duration-300 ease-out ${
          isOverlay ? 'w-full md:w-[400px]' : 'w-[400px]'
        } ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <h2 className="truncate text-base font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-text-muted hover:bg-white/5 hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </>
  );
}
