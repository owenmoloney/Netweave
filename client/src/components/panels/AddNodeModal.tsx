import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PersonCreateSchema,
  CompanyCreateSchema,
  CareerBoardCreateSchema,
  type PersonCreateInput,
  type CompanyCreateInput,
  type CareerBoardCreateInput,
} from '@netweave/shared';
import { useCreateNode, getApiErrorMessage } from '../../api/nodes';
import { useGraphStore } from '../../stores/graphStore';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';

const CAREER_BOARD_PRESETS = [
  { name: 'LinkedIn', website: 'https://www.linkedin.com' },
  { name: 'Indeed', website: 'https://www.indeed.com' },
  { name: 'Career Spring', website: 'https://www.careerspring.org' },
  { name: 'Handshake', website: 'https://joinhandshake.com' },
  { name: 'Glassdoor', website: 'https://www.glassdoor.com' },
];

export function AddNodeModal() {
  const modal = useGraphStore((s) => s.modal);
  const closeModal = useGraphStore((s) => s.closeModal);
  const selectNode = useGraphStore((s) => s.selectNode);
  const nodes = useGraphStore((s) => s.nodes);
  const createNode = useCreateNode();

  const isPerson = modal === 'addPerson';
  const isCompany = modal === 'addCompany';
  const isCareerBoard = modal === 'addCareerBoard';
  const open = isPerson || isCompany || isCareerBoard;

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

  const careerBoardForm = useForm<CareerBoardCreateInput>({
    resolver: zodResolver(CareerBoardCreateSchema) as Resolver<CareerBoardCreateInput>,
    defaultValues: {
      type: 'CAREER_BOARD',
      companyName: '',
      website: '',
      notes: '',
    },
  });

  const handleClose = () => {
    personForm.reset();
    companyForm.reset();
    careerBoardForm.reset();
    closeModal();
  };

  const onSubmitPerson = personForm.handleSubmit(async (data) => {
    try {
      const { node } = await createNode.mutateAsync(data);
      handleClose();
      selectNode(node.id);
    } catch {
      // error handled by mutation
    }
  });

  const onSubmitCompany = companyForm.handleSubmit(async (data) => {
    try {
      const { node } = await createNode.mutateAsync(data);
      handleClose();
      selectNode(node.id);
    } catch {
      // error handled by mutation
    }
  });

  const onSubmitCareerBoard = careerBoardForm.handleSubmit(async (data) => {
    try {
      const { node } = await createNode.mutateAsync(data);
      handleClose();
      selectNode(node.id);
    } catch {
      // error handled by mutation
    }
  });

  const applyPreset = (name: string, website: string) => {
    careerBoardForm.setValue('companyName', name);
    careerBoardForm.setValue('website', website);
  };

  const modalTitle = isPerson
    ? 'Add Person'
    : isCompany
      ? 'Add Company'
      : 'Add Career Board';

  return (
    <Modal open={open} onOpenChange={(v) => !v && handleClose()} title={modalTitle}>
      {isPerson && (
        <form onSubmit={onSubmitPerson} className="space-y-4">
          <Input
            id="fullName"
            label="Full name *"
            {...personForm.register('fullName')}
            error={personForm.formState.errors.fullName?.message}
          />
          <Input id="jobTitle" label="Job title" {...personForm.register('jobTitle')} />
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
          <Input id="linkedInUrl" label="LinkedIn URL" {...personForm.register('linkedInUrl')} />
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

      {isCareerBoard && (
        <form onSubmit={onSubmitCareerBoard} className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-text-muted">Quick add</p>
            <div className="flex flex-wrap gap-2">
              {CAREER_BOARD_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset.name, preset.website)}
                  className="rounded-full border border-white/10 bg-surface-elevated px-3 py-1 text-xs text-text-primary hover:border-accent/50 hover:text-accent"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
          <Input
            id="boardName"
            label="Board name *"
            {...careerBoardForm.register('companyName')}
            error={careerBoardForm.formState.errors.companyName?.message}
          />
          <Input id="boardWebsite" label="Website" {...careerBoardForm.register('website')} />
          <Textarea id="boardNotes" label="Notes" {...careerBoardForm.register('notes')} />
          {createNode.isError && (
            <p className="text-sm text-danger">{getApiErrorMessage(createNode.error)}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createNode.isPending}>
              {createNode.isPending ? 'Creating…' : 'Add Career Board'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
