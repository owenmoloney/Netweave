import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, Search, LogOut, CalendarPlus, LayoutGrid } from 'lucide-react';
import { useGraphStore } from '../stores/graphStore';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';

function useSearchShortcutLabel(): string {
  const [label, setLabel] = useState('⌘K');
  useEffect(() => {
    const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
    setLabel(isMac ? '⌘K' : 'Ctrl+K');
  }, []);
  return label;
}

export function Header({
  onImportGoogle,
  onOrganize,
  organizing = false,
}: {
  onImportGoogle: () => void;
  onOrganize: () => void;
  organizing?: boolean;
}) {
  const navigate = useNavigate();
  const searchShortcut = useSearchShortcutLabel();

  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const saveStatus = useGraphStore((s) => s.saveStatus);
  const openModal = useGraphStore((s) => s.openModal);
  const openSearch = useGraphStore((s) => s.openSearch);

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const peopleCount = Array.from(nodes.values()).filter((n) => n.type === 'PERSON').length;
  const companyCount = Array.from(nodes.values()).filter((n) => n.type === 'COMPANY').length;
  const boardCount = Array.from(nodes.values()).filter((n) => n.type === 'CAREER_BOARD').length;
  const edgeCount = edges.size;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as HTMLElement)) {
        setAddMenuOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as HTMLElement)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

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
        {peopleCount} people · {companyCount} companies · {boardCount} boards · {edgeCount} connections
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <button
          type="button"
          onClick={openSearch}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface-elevated px-3 py-1.5 text-sm text-text-muted transition hover:border-white/20 hover:text-text-primary"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden rounded border border-white/10 px-1 text-xs md:inline">
            {searchShortcut}
          </kbd>
        </button>

        <span className={`text-sm ${saveColor}`}>{saveLabel}</span>

        <Button type="button" variant="secondary" size="sm" className="gap-1" onClick={onImportGoogle}>
          <CalendarPlus size={14} />
          <span className="hidden sm:inline">Import</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-1"
          onClick={onOrganize}
          disabled={organizing}
        >
          <LayoutGrid size={14} />
          <span className="hidden sm:inline">{organizing ? 'Organizing…' : 'Organize'}</span>
        </Button>

        <div className="relative" ref={addMenuRef}>
          <Button onClick={() => setAddMenuOpen(!addMenuOpen)} className="gap-1">
            <Plus size={16} />
            Add
            <ChevronDown size={14} />
          </Button>

          {addMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-white/10 bg-surface-elevated py-1 shadow-xl">
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-white/5"
                onClick={() => {
                  openModal('addPerson');
                  setAddMenuOpen(false);
                }}
              >
                Add Person
              </button>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-white/5"
                onClick={() => {
                  openModal('addCompany');
                  setAddMenuOpen(false);
                }}
              >
                Add Company
              </button>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-white/5"
                onClick={() => {
                  openModal('addCareerBoard');
                  setAddMenuOpen(false);
                }}
              >
                Add Career Board
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-surface-elevated text-sm font-medium text-text-primary hover:border-white/20"
            title="Account"
          >
            You
          </button>

          {accountMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-white/10 bg-surface-elevated py-1 shadow-xl">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-white/5"
                onClick={handleLogout}
              >
                <LogOut size={14} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
