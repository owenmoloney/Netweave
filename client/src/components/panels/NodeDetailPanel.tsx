import { useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PersonUpdateSchema,
  CompanyUpdateSchema,
  CareerBoardUpdateSchema,
  type PersonUpdateInput,
  type CompanyUpdateInput,
  type CareerBoardUpdateInput,
  type Node,
  getNodeDisplayName,
} from '@netweave/shared';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { useUpdateNode, useDeleteNode } from '../../api/nodes';
import { useDeleteEdge } from '../../api/edges';
import { useGraphStore } from '../../stores/graphStore';
import { formatEdgeSummary } from '../../utils/edgeContext';
import { Drawer } from '../ui/Drawer';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-text-primary whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function LinkField({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null | undefined;
  href: string;
}) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline break-all"
        >
          {value}
        </a>
      </dd>
    </div>
  );
}

function PersonView({ node }: { node: Node }) {
  const companyName = useGraphStore((s) => {
    if (!node.companyId) return null;
    return s.nodes.get(node.companyId)?.companyName ?? null;
  });

  return (
    <dl className="space-y-3">
      <Field label="Full name" value={node.fullName} />
      <Field label="Job title" value={node.jobTitle} />
      <Field label="Company" value={companyName} />
      <LinkField label="Email" value={node.email} href={`mailto:${node.email}`} />
      <LinkField label="LinkedIn" value={node.linkedInUrl} href={node.linkedInUrl!} />
      <Field label="Notes" value={node.notes} />
    </dl>
  );
}

function CompanyView({ node }: { node: Node }) {
  const websiteHref =
    node.website && !node.website.startsWith('http')
      ? `https://${node.website}`
      : (node.website ?? '');

  return (
    <dl className="space-y-3">
      <Field label="Name" value={node.companyName} />
      <Field label="Industry" value={node.industry} />
      <Field label="Location" value={node.location} />
      <LinkField label="Website" value={node.website} href={websiteHref} />
      <Field label="Notes" value={node.notes} />
    </dl>
  );
}

function CareerBoardView({ node }: { node: Node }) {
  const websiteHref =
    node.website && !node.website.startsWith('http')
      ? `https://${node.website}`
      : (node.website ?? '');

  return (
    <dl className="space-y-3">
      <Field label="Board name" value={node.companyName} />
      <LinkField label="Website" value={node.website} href={websiteHref} />
      <Field label="Notes" value={node.notes} />
    </dl>
  );
}

function EdgeList({ nodeId }: { nodeId: string }) {
  const edges = useGraphStore((s) => s.edges);
  const nodes = useGraphStore((s) => s.nodes);
  const focusNode = useGraphStore((s) => s.focusNode);
  const openModal = useGraphStore((s) => s.openModal);
  const deleteEdge = useDeleteEdge();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const connected = Array.from(edges.values()).filter(
    (e) => e.sourceId === nodeId || e.targetId === nodeId,
  );

  const handleDelete = async (edgeId: string) => {
    await deleteEdge.mutateAsync(edgeId);
    setConfirmDeleteId(null);
  };

  if (connected.length === 0) {
    return <p className="text-sm text-text-muted">No connections yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {connected.map((edge) => {
        const otherId = edge.sourceId === nodeId ? edge.targetId : edge.sourceId;
        const other = nodes.get(otherId);
        if (!other) return null;

        const summary = formatEdgeSummary(edge, nodes);

        return (
          <li
            key={edge.id}
            className="rounded-lg border border-white/10 bg-surface-elevated px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {getNodeDisplayName(other)}
                </p>
                <p className="text-xs text-text-muted">{summary.headline}</p>
                {summary.details.length > 0 && (
                  <p className="mt-1 text-xs text-text-muted">{summary.details.join(' · ')}</p>
                )}
                {summary.notes && (
                  <p className="mt-1 text-xs italic text-text-muted">{summary.notes}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button size="sm" variant="ghost" onClick={() => focusNode(otherId)}>
                  Go to
                </Button>
                <button
                  type="button"
                  onClick={() => openModal('editEdge', { edgeId: edge.id })}
                  className="rounded p-1 text-text-muted hover:bg-white/5 hover:text-text-primary"
                  title="Edit connection"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(edge.id)}
                  className="rounded p-1 text-text-muted hover:bg-white/5 hover:text-danger"
                  title="Delete connection"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {confirmDeleteId === edge.id && (
              <div className="mt-2 rounded border border-danger/30 bg-danger/10 p-2">
                <p className="text-xs text-text-primary">Remove this connection?</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(edge.id)}
                    disabled={deleteEdge.isPending}
                  >
                    Delete
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setConfirmDeleteId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function NodeDetailPanel({ isOverlay = false }: { isOverlay?: boolean }) {
  const isPanelOpen = useGraphStore((s) => s.isPanelOpen);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const nodes = useGraphStore((s) => s.nodes);
  const closePanel = useGraphStore((s) => s.closePanel);
  const openModal = useGraphStore((s) => s.openModal);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateNode = useUpdateNode();
  const deleteNode = useDeleteNode();

  const node = selectedNodeId ? nodes.get(selectedNodeId) : null;

  useEffect(() => {
    setIsEditing(false);
    setShowDeleteConfirm(false);
  }, [selectedNodeId]);

  const personForm = useForm<PersonUpdateInput>({
    resolver: zodResolver(PersonUpdateSchema) as Resolver<PersonUpdateInput>,
  });

  const companyForm = useForm<CompanyUpdateInput>({
    resolver: zodResolver(CompanyUpdateSchema) as Resolver<CompanyUpdateInput>,
  });

  const careerBoardForm = useForm<CareerBoardUpdateInput>({
    resolver: zodResolver(CareerBoardUpdateSchema) as Resolver<CareerBoardUpdateInput>,
  });

  if (!node) {
    return (
      <Drawer open={false} onClose={closePanel} title="" isOverlay={isOverlay}>
        <span />
      </Drawer>
    );
  }

  const title = getNodeDisplayName(node);
  const isSelf = node.type === 'SELF';
  const companies = Array.from(nodes.values()).filter((n) => n.type === 'COMPANY');

  const startEditing = () => {
    if (node.type === 'PERSON') {
      personForm.reset({
        fullName: node.fullName ?? '',
        jobTitle: node.jobTitle ?? '',
        companyId: node.companyId,
        email: node.email ?? '',
        linkedInUrl: node.linkedInUrl ?? '',
        notes: node.notes ?? '',
      });
    } else if (node.type === 'COMPANY') {
      companyForm.reset({
        companyName: node.companyName ?? '',
        industry: node.industry ?? '',
        location: node.location ?? '',
        website: node.website ?? '',
        notes: node.notes ?? '',
      });
    } else if (node.type === 'CAREER_BOARD') {
      careerBoardForm.reset({
        companyName: node.companyName ?? '',
        website: node.website ?? '',
        notes: node.notes ?? '',
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (node.type === 'PERSON') {
      await personForm.handleSubmit(async (data) => {
        await updateNode.mutateAsync({ id: node.id, data });
        setIsEditing(false);
      })();
    } else if (node.type === 'COMPANY') {
      await companyForm.handleSubmit(async (data) => {
        await updateNode.mutateAsync({ id: node.id, data });
        setIsEditing(false);
      })();
    } else if (node.type === 'CAREER_BOARD') {
      await careerBoardForm.handleSubmit(async (data) => {
        await updateNode.mutateAsync({ id: node.id, data });
        setIsEditing(false);
      })();
    }
  };

  const handleDelete = async () => {
    await deleteNode.mutateAsync(node.id);
    setShowDeleteConfirm(false);
    closePanel();
  };

  return (
    <Drawer open={isPanelOpen} onClose={closePanel} title={title} isOverlay={isOverlay}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
            {node.type === 'CAREER_BOARD' ? 'career board' : node.type.toLowerCase()}
          </span>
          <span className="text-xs text-text-muted font-mono">
            Updated {format(new Date(node.updatedAt), 'MMM d, yyyy')}
          </span>
        </div>

        {!isEditing ? (
          <>
            {node.type === 'PERSON' && <PersonView node={node} />}
            {node.type === 'COMPANY' && <CompanyView node={node} />}
            {node.type === 'CAREER_BOARD' && <CareerBoardView node={node} />}
            {isSelf && (
              <p className="text-sm text-text-muted">
                This is you — the anchor of your network. Your connections radiate from here.
              </p>
            )}
          </>
        ) : node.type === 'PERSON' ? (
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <Input label="Full name" {...personForm.register('fullName')} />
            <Input label="Job title" {...personForm.register('jobTitle')} />
            <div className="space-y-1">
              <label className="block text-sm text-text-muted">Company</label>
              <select
                {...personForm.register('companyId')}
                className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-text-primary"
              >
                <option value="">None</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Email" {...personForm.register('email')} />
            <Input label="LinkedIn" {...personForm.register('linkedInUrl')} />
            <Textarea label="Notes" {...personForm.register('notes')} />
          </form>
        ) : node.type === 'COMPANY' ? (
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <Input label="Company name" {...companyForm.register('companyName')} />
            <Input label="Industry" {...companyForm.register('industry')} />
            <Input label="Location" {...companyForm.register('location')} />
            <Input label="Website" {...companyForm.register('website')} />
            <Textarea label="Notes" {...companyForm.register('notes')} />
          </form>
        ) : node.type === 'CAREER_BOARD' ? (
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <Input label="Board name" {...careerBoardForm.register('companyName')} />
            <Input label="Website" {...careerBoardForm.register('website')} />
            <Textarea label="Notes" {...careerBoardForm.register('notes')} />
          </form>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Connections</h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openModal('addEdge', { sourceId: node.id })}
            >
              Add Connection
            </Button>
          </div>
          <EdgeList nodeId={node.id} />
        </div>

        {!isSelf && (
          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {!isEditing ? (
              <>
                <Button variant="secondary" onClick={startEditing}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleSave} disabled={updateNode.isPending}>
                  Save
                </Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        )}

        {showDeleteConfirm && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-4">
            <p className="text-sm text-text-primary">
              Delete <strong>{title}</strong>? All connections to this node will also be removed.
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleteNode.isPending}>
                Delete
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
