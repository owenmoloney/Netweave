import { useEffect } from 'react';

interface UseKeyboardOptions {
  onSearch?: () => void;
  onEscape?: () => void;
}

export function useKeyboard({ onSearch, onEscape }: UseKeyboardOptions): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearch?.();
      }
      if (e.key === 'Escape') {
        onEscape?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSearch, onEscape]);
}
