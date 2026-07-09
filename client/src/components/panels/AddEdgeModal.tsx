import { useMemo, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EdgeCreateSchema, type EdgeCreateInput, getNodeDisplayName } from '@netweave/shared';
import { useCreateEdge } from '../../api/edges';
import { getApiErrorMessage } from '../../api/mutationUtils';
import { useGraphStore } from '../../stores/graphStore';
import { RELATIONSHIP_OPTIONS } from '../../utils/relationships';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Star } from 'lucide-react';

function isValidEdgeTarget(
  sourceId: string,
  targetId: string,
  nodes: Map<string, { id: string; type: string }>,
): boolean {
  const source = nodes.get(sourceId);
  const target = nodes.get(targetId);
  if (!source || !target) return false;
  if (source.id === target.id) return false;
  if (source.type === 'COMPANY' && target.type === 'COMPANY') return false;
  return true;
}

export function AddEdgeModal() {
  const modal = useGraphStore((s) => s.modal);
  const closeModal = useGraphStore((s) => s.closeModal);
  const addEdgeSourceId = useGraphStore((s) => s.addEdgeSourceId);
  const nodes = useGraphStore((s) => s.nodes);
  const createEdge = useCreateEdge();

  const open = modal === 'addEdge';
  const sourceNode = addEdgeSourceId ? nodes.get(addEdgeSourceId) : null;

  const targetOptions = useMemo(() => {
    if (!addEdgeSourceId) return [];
    return Array.from(nodes.values()).filter((n) =>
      isValidEdgeTarget(addEdgeSourceId, n.id, nodes),
    );
  }, [nodes, addEdgeSourceId]);

  const form = useForm<EdgeCreateInput>({
    resolver: zodResolver(EdgeCreateSchema) as Resolver<EdgeCreateInput>,
    defaultValues: {
      sourceId: addEdgeSourceId ?? '',
      targetId: '',
      relationshipType: 'other',
      howMet: '',
      whereMet: '',
      whyTalked: '',
      strength: 3,
      followUpNotes: '',
    },
  });

  const strength = form.watch('strength') ?? 3;

  useEffect(() => {
    if (open && addEdgeSourceId) {
      form.reset({
        sourceId: addEdgeSourceId,
        targetId: '',
        relationshipType: 'other',
        howMet: '',
        whereMet: '',
        whyTalked: '',
        strength: 3,
        followUpNotes: '',
      });
    }
  }, [open, addEdgeSourceId, form]);

  const handleClose = () => {
    form.reset();
    closeModal();
  };

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await createEdge.mutateAsync({
        ...data,
        sourceId: addEdgeSourceId ?? data.sourceId,
      });
      handleClose();
    } catch {
      // handled by mutation
    }
  });

  const sourceName = sourceNode ? getNodeDisplayName(sourceNode) : 'Node';

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && handleClose()}
      title={`Connect ${sourceName} to…`}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="targetId" className="block text-sm text-text-muted">
            Target node *
          </label>
          <select
            id="targetId"
            {...form.register('targetId')}
            className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          >
            <option value="">Select a node…</option>
            {targetOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {getNodeDisplayName(n)} ({n.type.toLowerCase()})
              </option>
            ))}
          </select>
          {form.formState.errors.targetId && (
            <p className="text-xs text-danger">{form.formState.errors.targetId.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm text-text-muted">Relationship type</label>
          <select
            {...form.register('relationshipType')}
            className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          >
            {RELATIONSHIP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm text-text-muted">Strength</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => form.setValue('strength', n)}
                className="p-1"
              >
                <Star
                  size={20}
                  className={n <= strength ? 'fill-accent text-accent' : 'text-text-muted'}
                />
              </button>
            ))}
          </div>
        </div>

        <Input id="howMet" label="How you met" {...form.register('howMet')} />
        <Input id="whereMet" label="Where you met" {...form.register('whereMet')} />
        <Input id="whyTalked" label="Why you talked" {...form.register('whyTalked')} />
        <Input
          id="dateOfInteraction"
          label="Date of interaction"
          type="date"
          onChange={(e) => {
            const val = e.target.value;
            form.setValue(
              'dateOfInteraction',
              val ? new Date(val).toISOString() : null,
            );
          }}
        />
        <Textarea id="followUpNotes" label="Follow-up notes" {...form.register('followUpNotes')} />

        {createEdge.isError && (
          <p className="text-sm text-danger">{getApiErrorMessage(createEdge.error)}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createEdge.isPending}>
            {createEdge.isPending ? 'Creating…' : 'Add Connection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
