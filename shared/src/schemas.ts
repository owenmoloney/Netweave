import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const optionalString = z.string().optional().nullable();

export const PersonCreateSchema = z.object({
  type: z.literal('PERSON'),
  fullName: z.string().min(1, 'Full name is required'),
  jobTitle: optionalString,
  companyId: z
    .union([z.string().uuid(), z.literal('')])
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  linkedInUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  notes: optionalString,
  posX: z.number().optional(),
  posY: z.number().optional(),
});

export const CompanyCreateSchema = z.object({
  type: z.literal('COMPANY'),
  companyName: z.string().min(1, 'Company name is required'),
  industry: optionalString,
  location: optionalString,
  website: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  notes: optionalString,
  posX: z.number().optional(),
  posY: z.number().optional(),
});

export const CareerBoardCreateSchema = z.object({
  type: z.literal('CAREER_BOARD'),
  companyName: z.string().min(1, 'Board name is required'),
  website: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  notes: optionalString,
  posX: z.number().optional(),
  posY: z.number().optional(),
});

export const NodeCreateSchema = z.discriminatedUnion('type', [
  PersonCreateSchema,
  CompanyCreateSchema,
  CareerBoardCreateSchema,
]);

export const PersonUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  jobTitle: optionalString,
  companyId: z.string().uuid().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  linkedInUrl: z.string().url().optional().nullable().or(z.literal('')),
  notes: optionalString,
});

export const CompanyUpdateSchema = z.object({
  companyName: z.string().min(1).optional(),
  industry: optionalString,
  location: optionalString,
  website: z.string().url().optional().nullable().or(z.literal('')),
  notes: optionalString,
});

export const CareerBoardUpdateSchema = z.object({
  companyName: z.string().min(1).optional(),
  website: z.string().url().optional().nullable().or(z.literal('')),
  notes: optionalString,
});

export const NodeUpdateSchema = z
  .object({
    fullName: z.string().min(1).optional(),
    jobTitle: optionalString,
    companyId: z.string().uuid().optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal('')),
    linkedInUrl: z.string().url().optional().nullable().or(z.literal('')),
    companyName: z.string().min(1).optional(),
    industry: optionalString,
    location: optionalString,
    website: z.string().url().optional().nullable().or(z.literal('')),
    notes: optionalString,
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided',
  });

export const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const RelationshipTypeSchema = z.enum([
  'met_at_event',
  'colleague',
  'intro_by',
  'client',
  'mentor',
  'recruiter',
  'friend',
  'applied_via',
  'found_listing',
  'board_referral',
  'board_contact',
  'other',
]);

export const EdgeCreateSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid('Please select a target node'),
  relationshipType: RelationshipTypeSchema.default('other'),
  howMet: optionalString,
  whereMet: optionalString,
  whyTalked: optionalString,
  dateOfInteraction: z.string().datetime().optional().nullable(),
  strength: z.number().int().min(1).max(5).default(3),
  followUpNotes: optionalString,
});

export const EdgeUpdateSchema = z.object({
  relationshipType: RelationshipTypeSchema.optional(),
  howMet: optionalString,
  whereMet: optionalString,
  whyTalked: optionalString,
  dateOfInteraction: z.string().datetime().optional().nullable(),
  strength: z.number().int().min(1).max(5).optional(),
  followUpNotes: optionalString,
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PersonCreateInput = z.infer<typeof PersonCreateSchema>;
export type CompanyCreateInput = z.infer<typeof CompanyCreateSchema>;
export type CareerBoardCreateInput = z.infer<typeof CareerBoardCreateSchema>;
export type NodeCreateInput = z.infer<typeof NodeCreateSchema>;
export type PersonUpdateInput = z.infer<typeof PersonUpdateSchema>;
export type CompanyUpdateInput = z.infer<typeof CompanyUpdateSchema>;
export type CareerBoardUpdateInput = z.infer<typeof CareerBoardUpdateSchema>;
export type NodeUpdateInput = z.infer<typeof NodeUpdateSchema>;
export type NodePositionInput = z.infer<typeof NodePositionSchema>;
export type EdgeCreateInput = z.infer<typeof EdgeCreateSchema>;
export type EdgeUpdateInput = z.infer<typeof EdgeUpdateSchema>;
