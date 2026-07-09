import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, Search } from 'lucide-react';
import { useGraphStore } from '../stores/graphStore';
import { Button } from './ui/Button';

export function Header() {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const saveStatus = useGraphStore((s) => s.saveStatus);
  const openModal = useGraphStore((s) => s.openModal);
  const openSearch = useGraphStore((s) => s.openSearch);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const peopleCount = Array.from(nodes.values()).filter((n) => n.type === 'PERSON').length;
  const companyCount = Array.from(nodes.values()).filter((n) => n.type === 'COMPANY').length;
  const edgeCount = edges.size;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const saveLabel =
    saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Error' : 'Saved';
  const saveColor =
    saveStatus === 'saving'
      ? 'text-text-muted'
      : saveStatus === 'error'
        ? 'text-danger'
        : 'text-success';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-surface px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-lg font-bold text-text-primary">Netweave</span>
      </div>

      <div className="hidden text-sm text-text-muted sm:block">
        {peopleCount} people · {companyCount} companies · {edgeCount} connections
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <button
          type="button"
          onClick={openSearch}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface-elevated px-3 py-1.5 text-sm text-text-muted transition hover:border-white/20 hover:text-text-primary"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded border border-white/10 px-1 text-xs md:inline">⌘K</kbd>
        </button>

        <span className={`text-sm ${saveColor}`}>{saveLabel}</span>

        <div className="relative" ref={menuRef}>
          <Button onClick={() => setMenuOpen(!menuOpen)} className="gap-1">
            <Plus size={16} />
            Add
            <ChevronDown size={14} />
          </Button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border border-white/10 bg-surface-elevated py-1 shadow-xl">
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-white/5"
                onClick={() => {
                  openModal('addPerson');
                  setMenuOpen(false);
                }}
              >
                Add Person
              </button>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-white/5"
                onClick={() => {
                  openModal('addCompany');
                  setMenuOpen(false);
                }}
              >
                Add Company
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
