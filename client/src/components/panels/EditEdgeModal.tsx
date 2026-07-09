import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EdgeUpdateSchema,
  type EdgeUpdateInput,
  getNodeDisplayName,
  isJobBoardPersonConnection,
  JOB_BOARD_PERSON_EDGE_LABELS,
} from '@netweave/shared';
import { Star } from 'lucide-react';
import { useUpdateEdge } from '../../api/edges';
import { getApiErrorMessage } from '../../api/mutationUtils';
import { useGraphStore } from '../../stores/graphStore';
import {
  JOB_BOARD_RELATIONSHIP_OPTIONS,
  NETWORKING_RELATIONSHIP_OPTIONS,
} from '../../utils/relationships';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function StrengthPicker({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm text-text-muted">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} className="p-1">
            <Star
              size={20}
              className={n <= value ? 'fill-accent text-accent' : 'text-text-muted'}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function EditEdgeModal() {
  const modal = useGraphStore((s) => s.modal);
  const editEdgeId = useGraphStore((s) => s.editEdgeId);
  const edges = useGraphStore((s) => s.edges);
  const nodes = useGraphStore((s) => s.nodes);
  const closeModal = useGraphStore((s) => s.closeModal);
  const updateEdge = useUpdateEdge();

  const open = modal === 'editEdge';
  const edge = editEdgeId ? edges.get(editEdgeId) : null;
  const sourceNode = edge ? nodes.get(edge.sourceId) : null;
  const targetNode = edge ? nodes.get(edge.targetId) : null;

  const isJobBoardLink =
    sourceNode &&
    targetNode &&
    isJobBoardPersonConnection(sourceNode.type, targetNode.type);

  const form = useForm<EdgeUpdateInput>({
    resolver: zodResolver(EdgeUpdateSchema) as Resolver<EdgeUpdateInput>,
  });

  const strength = form.watch('strength') ?? 3;

  useEffect(() => {
    if (open && edge) {
      form.reset({
        relationshipType: edge.relationshipType,
        howMet: edge.howMet ?? '',
        whereMet: edge.whereMet ?? '',
        whyTalked: edge.whyTalked ?? '',
        dateOfInteraction: edge.dateOfInteraction,
        strength: edge.strength,
        followUpNotes: edge.followUpNotes ?? '',
      });
    }
  }, [open, edge, form]);

  const handleClose = () => {
    form.reset();
    closeModal();
  };

  const onSubmit = form.handleSubmit(async (data) => {
    if (!edge) return;
    try {
      await updateEdge.mutateAsync({ id: edge.id, data });
      handleClose();
    } catch {
      // handled by mutation
    }
  });

  if (!edge) return null;

  const relationshipOptions = isJobBoardLink
    ? JOB_BOARD_RELATIONSHIP_OPTIONS
    : NETWORKING_RELATIONSHIP_OPTIONS;

  const modalTitle = isJobBoardLink ? 'Edit board connection' : 'Edit Connection';

  return (
    <Modal open={open} onOpenChange={(v) => !v && handleClose()} title={modalTitle}>
      <p className="mb-4 text-sm text-text-muted">
        {sourceNode ? getNodeDisplayName(sourceNode) : 'Unknown'} →{' '}
        {targetNode ? getNodeDisplayName(targetNode) : 'Unknown'}
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm text-text-muted">
            {isJobBoardLink
              ? JOB_BOARD_PERSON_EDGE_LABELS.relationshipType
              : 'Relationship type'}
          </label>
          <select
            {...form.register('relationshipType')}
            className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          >
            {relationshipOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {isJobBoardLink ? (
          <>
            <Input
              id="whyTalked"
              label={JOB_BOARD_PERSON_EDGE_LABELS.whyTalked}
              {...form.register('whyTalked')}
            />
            <Input
              id="whereMet"
              label={JOB_BOARD_PERSON_EDGE_LABELS.whereMet}
              {...form.register('whereMet')}
            />
            <Input
              id="howMet"
              label={JOB_BOARD_PERSON_EDGE_LABELS.howMet}
              {...form.register('howMet')}
            />
            <Input
              id="dateOfInteraction"
              label={JOB_BOARD_PERSON_EDGE_LABELS.dateOfInteraction}
              type="date"
              defaultValue={toDateInputValue(edge.dateOfInteraction)}
              onChange={(e) => {
                const val = e.target.value;
                form.setValue(
                  'dateOfInteraction',
                  val ? new Date(val).toISOString() : null,
                );
              }}
            />
            <StrengthPicker
              value={strength}
              onChange={(n) => form.setValue('strength', n)}
              label={JOB_BOARD_PERSON_EDGE_LABELS.strength}
            />
            <Textarea
              id="followUpNotes"
              label={JOB_BOARD_PERSON_EDGE_LABELS.followUpNotes}
              {...form.register('followUpNotes')}
            />
          </>
        ) : (
          <>
            <StrengthPicker
              value={strength}
              onChange={(n) => form.setValue('strength', n)}
              label="Strength"
            />
            <Input id="howMet" label="How you met" {...form.register('howMet')} />
            <Input id="whereMet" label="Where you met" {...form.register('whereMet')} />
            <Input id="whyTalked" label="Why you talked" {...form.register('whyTalked')} />
            <Input
              id="dateOfInteraction"
              label="Date of interaction"
              type="date"
              defaultValue={toDateInputValue(edge.dateOfInteraction)}
              onChange={(e) => {
                const val = e.target.value;
                form.setValue(
                  'dateOfInteraction',
                  val ? new Date(val).toISOString() : null,
                );
              }}
            />
            <Textarea id="followUpNotes" label="Follow-up notes" {...form.register('followUpNotes')} />
          </>
        )}

        {updateEdge.isError && (
          <p className="text-sm text-danger">{getApiErrorMessage(updateEdge.error)}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateEdge.isPending}>
            {updateEdge.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
