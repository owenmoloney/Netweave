import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PersonCreateSchema,
  CompanyCreateSchema,
  type PersonCreateInput,
  type CompanyCreateInput,
} from '@netweave/shared';
import { useCreateNode, getApiErrorMessage } from '../../api/nodes';
import { useGraphStore } from '../../stores/graphStore';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';

export function AddNodeModal() {
  const modal = useGraphStore((s) => s.modal);
  const closeModal = useGraphStore((s) => s.closeModal);
  const selectNode = useGraphStore((s) => s.selectNode);
  const nodes = useGraphStore((s) => s.nodes);
  const createNode = useCreateNode();

  const isPerson = modal === 'addPerson';
  const isCompany = modal === 'addCompany';
  const open = isPerson || isCompany;

  const companies = Array.from(nodes.values()).filter((n) => n.type === 'COMPANY');

  const personForm = useForm<PersonCreateInput>({
    resolver: zodResolver(PersonCreateSchema) as Resolver<PersonCreateInput>,
    defaultValues: {
      type: 'PERSON',
      fullName: '',
      jobTitle: '',
      companyId: null,
      email: '',
      linkedInUrl: '',
      notes: '',
    },
  });

  const companyForm = useForm<CompanyCreateInput>({
    resolver: zodResolver(CompanyCreateSchema) as Resolver<CompanyCreateInput>,
    defaultValues: {
      type: 'COMPANY',
      companyName: '',
      industry: '',
      location: '',
      website: '',
      notes: '',
    },
  });

  const handleClose = () => {
    personForm.reset();
    companyForm.reset();
    closeModal();
  };

  const onSubmitPerson = personForm.handleSubmit(async (data) => {
    try {
      const node = await createNode.mutateAsync(data);
      handleClose();
      selectNode(node.id);
    } catch {
      // error handled by mutation
    }
  });

  const onSubmitCompany = companyForm.handleSubmit(async (data) => {
    try {
      const node = await createNode.mutateAsync(data);
      handleClose();
      selectNode(node.id);
    } catch {
      // error handled by mutation
    }
  });

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && handleClose()}
      title={isPerson ? 'Add Person' : 'Add Company'}
    >
      {isPerson && (
        <form onSubmit={onSubmitPerson} className="space-y-4">
          <Input
            id="fullName"
            label="Full name *"
            {...personForm.register('fullName')}
            error={personForm.formState.errors.fullName?.message}
          />
          <Input
            id="jobTitle"
            label="Job title"
            {...personForm.register('jobTitle')}
          />
          <div className="space-y-1">
            <label htmlFor="companyId" className="block text-sm text-text-muted">
              Company
            </label>
            <select
              id="companyId"
              {...personForm.register('companyId')}
              className="w-full rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            >
              <option value="">None</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>
          <Input id="email" label="Email" type="email" {...personForm.register('email')} />
          <Input
            id="linkedInUrl"
            label="LinkedIn URL"
            {...personForm.register('linkedInUrl')}
          />
          <Textarea id="notes" label="Notes" {...personForm.register('notes')} />
          {createNode.isError && (
            <p className="text-sm text-danger">{getApiErrorMessage(createNode.error)}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createNode.isPending}>
              {createNode.isPending ? 'Creating…' : 'Add Person'}
            </Button>
          </div>
        </form>
      )}

      {isCompany && (
        <form onSubmit={onSubmitCompany} className="space-y-4">
          <Input
            id="companyName"
            label="Company name *"
            {...companyForm.register('companyName')}
            error={companyForm.formState.errors.companyName?.message}
          />
          <Input id="industry" label="Industry" {...companyForm.register('industry')} />
          <Input id="location" label="Location" {...companyForm.register('location')} />
          <Input id="website" label="Website" {...companyForm.register('website')} />
          <Textarea id="notes" label="Notes" {...companyForm.register('notes')} />
          {createNode.isError && (
            <p className="text-sm text-danger">{getApiErrorMessage(createNode.error)}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createNode.isPending}>
              {createNode.isPending ? 'Creating…' : 'Add Company'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
