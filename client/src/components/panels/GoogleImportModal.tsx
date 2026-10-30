import { useEffect, useState } from 'react';
import type { GraphResponse } from '@netweave/shared';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { isGoogleConfigured } from '../../google/oauth';
import { runGoogleImport, type ScoredImport } from '../../google/importPeople';
import { commitCandidates } from '../../google/writeGraph';
import type { ImportProgress, PersonCandidate } from '../../google/types';
import { getApiErrorMessage } from '../../api/errors';

interface GoogleImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (graph: GraphResponse) => void;
}

function evidenceLine(candidate: PersonCandidate): string {
  const meetings = candidate.meetings.length;
  const threads = candidate.emailEvidence?.twoWayThreads ?? 0;
  const last = candidate.meetings[0];
  const lastBit = last ? ` · ${last.title}` : '';
  return `${meetings} meeting${meetings === 1 ? '' : 's'} · ${threads} 2-way thread${threads === 1 ? '' : 's'}${lastBit}`;
}

export function GoogleImportModal({ open, onOpenChange, onImported }: GoogleImportModalProps) {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scored, setScored] = useState<ScoredImport | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [autoAdded, setAutoAdded] = useState(0);
  const [autoMerged, setAutoMerged] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setProgress(null);
      setError(null);
      setScored(null);
      setSelected(new Set());
      setAutoAdded(0);
      setAutoMerged(0);
      setSaving(false);
    }
  }, [open]);

  const handleScan = async () => {
    setError(null);
    setScored(null);
    setSaving(false);
    setProgress({ phase: 'auth', message: 'Connecting to Google…' });
    try {
      const result = await runGoogleImport(setProgress);
      setProgress({ phase: 'writing', message: 'Adding high-confidence people…' });
      if (result.auto.length > 0) {
        const written = await commitCandidates(result.auto);
        setAutoAdded(written.added);
        setAutoMerged(written.merged);
        onImported(written.graph);
      } else {
        setAutoAdded(0);
        setAutoMerged(0);
      }
      setSelected(new Set(result.review.map((candidate) => candidate.email)));
      setScored(result);
      setProgress({ phase: 'done', message: 'Done' });
    } catch (err) {
      setError(getApiErrorMessage(err));
      setProgress(null);
    }
  };

  const handleAddSelected = async () => {
    if (!scored) return;
    const chosen = scored.review.filter((candidate) => selected.has(candidate.email));
    if (chosen.length === 0) {
      onOpenChange(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const written = await commitCandidates(chosen);
      onImported(written.graph);
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = (email: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Import from Google" wide>
      {!isGoogleConfigured() && (
        <p className="text-sm text-text-muted">
          Set <code className="text-text-primary">VITE_GOOGLE_CLIENT_ID</code> in <code className="text-text-primary">client/.env</code>. See
          docs/DEPLOYMENT.md.
        </p>
      )}

      {isGoogleConfigured() && !scored && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Reads the last 12 months of Calendar and Gmail metadata. 1:1 meetings and small meetings
            with a 2-way email are added automatically. Large meetings and newsletters are skipped.
            Email bodies are not stored.
          </p>
          {progress && progress.phase !== 'done' && (
            <p className="text-sm text-text-primary">{progress.message}</p>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button
            onClick={() => void handleScan()}
            disabled={Boolean(progress) && progress?.phase !== 'done'}
          >
            {progress && progress.phase !== 'done' ? progress.message : 'Connect Google and scan'}
          </Button>
        </div>
      )}

      {scored && (
        <div className="space-y-4">
          <p className="text-sm text-text-primary">
            Added {autoAdded} people
            {autoMerged > 0 ? ` · updated ${autoMerged} existing` : ''}. Skipped {scored.droppedCount}{' '}
            low-signal addresses.
          </p>

          {scored.review.length > 0 ? (
            <div>
              <p className="mb-2 text-sm text-text-muted">
                Review {scored.review.length} more (small meetings without email, or repeated 2-way
                mail):
              </p>
              <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-white/10 p-2">
                {scored.review.map((candidate) => (
                  <li key={candidate.email}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selected.has(candidate.email)}
                        onChange={() => toggle(candidate.email)}
                      />
                      <span>
                        <span className="text-text-primary">{candidate.fullName}</span>
                        <span className="block text-xs text-text-muted">
                          {candidate.email} · {candidate.reason} · {evidenceLine(candidate)}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-text-muted">Nothing left to review.</p>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
              Done
            </Button>
            {scored.review.length > 0 && (
              <Button onClick={() => void handleAddSelected()} disabled={saving}>
                {saving ? 'Adding…' : `Add selected (${selected.size})`}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
