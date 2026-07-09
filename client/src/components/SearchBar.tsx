import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { useGraphStore } from '../stores/graphStore';

export function SearchBar() {
  const isSearchOpen = useGraphStore((s) => s.isSearchOpen);
  const closeSearch = useGraphStore((s) => s.closeSearch);
  const focusNode = useGraphStore((s) => s.focusNode);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useSearch(query);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!isSearchOpen) return null;

  const selectResult = (id: string) => {
    focusNode(id);
    closeSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      selectResult(results[activeIndex].id);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={closeSearch} />
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 px-4">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-surface shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 px-4">
            <Search size={18} className="text-text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search people and companies…"
              className="flex-1 bg-transparent py-3.5 text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
            <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 text-xs text-text-muted sm:inline">
              esc
            </kbd>
          </div>

          {query.trim() && (
            <ul className="max-h-64 overflow-y-auto py-1">
              {results.length === 0 ? (
                <li className="px-4 py-3 text-sm text-text-muted">No results found</li>
              ) : (
                results.map((result, index) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => selectResult(result.id)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                        index === activeIndex ? 'bg-accent/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                          result.type === 'COMPANY'
                            ? 'bg-accent-secondary/20 text-accent-secondary'
                            : result.type === 'SELF'
                              ? 'bg-accent/20 text-accent'
                              : 'bg-white/10 text-text-muted'
                        }`}
                      >
                        {result.type === 'SELF' ? 'You' : result.type[0]}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{result.name}</p>
                        <p className="text-xs text-text-muted">{result.subtitle}</p>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
