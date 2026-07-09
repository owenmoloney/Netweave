import { useMemo, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EdgeCreateSchema,
  type EdgeCreateInput,
  getNodeDisplayName,
  isValidNodeConnection,
  isJobBoardPersonConnection,
  JOB_BOARD_PERSON_EDGE_LABELS,
  type Node,
} from '@netweave/shared';
import { useCreateEdge } from '../../api/edges';
import { getApiErrorMessage } from '../../api/mutationUtils';
import { useGraphStore } from '../../stores/graphStore';
import {
  JOB_BOARD_RELATIONSHIP_OPTIONS,
  NETWORKING_RELATIONSHIP_OPTIONS,
} from '../../utils/relationships';
import { getAddEdgeModalTitle } from '../../utils/edgeContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Star } from 'lucide-react';

function isValidEdgeTarget(
  sourceId: string,
  targetId: string,
  nodes: Map<string, { id: string; type: Node['type'] }>,
): boolean {
  const source = nodes.get(sourceId);
  const target = nodes.get(targetId);
  if (!source || !target) return false;
  return isValidNodeConnection(source, target);
}

function formatNodeType(type: Node['type']): string {
  if (type === 'CAREER_BOARD') return 'career board';
  return type.toLowerCase();
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

  const targetId = form.watch('targetId');
  const strength = form.watch('strength') ?? 3;
  const targetNode = targetId ? nodes.get(targetId) : null;

  const isJobBoardLink =
    sourceNode &&
    targetNode &&
    isJobBoardPersonConnection(sourceNode.type, targetNode.type);

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

  useEffect(() => {
    if (!isJobBoardLink) return;
    const current = form.getValues('relationshipType');
    const jobBoardTypes = JOB_BOARD_RELATIONSHIP_OPTIONS.map((o) => o.value);
    if (!jobBoardTypes.includes(current)) {
      form.setValue('relationshipType', 'applied_via');
    }
  }, [isJobBoardLink, form]);

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
  const targetName = targetNode ? getNodeDisplayName(targetNode) : null;
  const modalTitle = sourceNode
    ? getAddEdgeModalTitle(
        sourceName,
        sourceNode.type,
        targetNode?.type ?? null,
        targetName,
      )
    : 'Add Connection';

  const relationshipOptions = isJobBoardLink
    ? JOB_BOARD_RELATIONSHIP_OPTIONS
    : NETWORKING_RELATIONSHIP_OPTIONS;

  return (
    <Modal open={open} onOpenChange={(v) => !v && handleClose()} title={modalTitle}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="targetId" className="block text-sm text-text-muted">
            {isJobBoardLink ? 'Career board' : 'Target node'} *
          </label>
          <select
            id="targetId"
            {...form.register('targetId')}
            className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          >
            <option value="">
              {sourceNode?.type === 'CAREER_BOARD'
                ? 'Select a contact…'
                : 'Select a node…'}
            </option>
            {targetOptions.map((n) => (
              <option key={n.id} value={n.id}>
                {getNodeDisplayName(n)} ({formatNodeType(n.type)})
              </option>
            ))}
          </select>
          {form.formState.errors.targetId && (
            <p className="text-xs text-danger">{form.formState.errors.targetId.message}</p>
          )}
        </div>

        {isJobBoardLink ? (
          <>
            <div className="space-y-1">
              <label className="block text-sm text-text-muted">
                {JOB_BOARD_PERSON_EDGE_LABELS.relationshipType}
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

            <Input
              id="whyTalked"
              label={JOB_BOARD_PERSON_EDGE_LABELS.whyTalked}
              placeholder="e.g. Software Engineer"
              {...form.register('whyTalked')}
            />
            <Input
              id="whereMet"
              label={JOB_BOARD_PERSON_EDGE_LABELS.whereMet}
              placeholder="e.g. Acme Corp"
              {...form.register('whereMet')}
            />
            <Input
              id="howMet"
              label={JOB_BOARD_PERSON_EDGE_LABELS.howMet}
              placeholder="e.g. Messaged on LinkedIn, applied to posting"
              {...form.register('howMet')}
            />
            <Input
              id="dateOfInteraction"
              label={JOB_BOARD_PERSON_EDGE_LABELS.dateOfInteraction}
              type="date"
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
              placeholder="Interview status, next steps, etc."
              {...form.register('followUpNotes')}
            />
          </>
        ) : (
          <>
            <div className="space-y-1">
              <label className="block text-sm text-text-muted">Relationship type</label>
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
