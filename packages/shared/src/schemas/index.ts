import { z } from 'zod';
import {
  PermitStatus,
  PermitType,
  DocumentCategory,
  DocumentStatus,
  ChecklistItemStatus,
  InspectionStatus,
  FeeStatus,
  UserRole,
} from '../types';

// ─── BASE ─────────────────────────────────────────────────────────────────────────

export const UUIDSchema = z.string().uuid();

// ─── PROJECT ─────────────────────────────────────────────────────────────────────

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  startDate: z.string().datetime().optional(),
  estimatedEndDate: z.string().datetime().optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

// ─── PERMIT ──────────────────────────────────────────────────────────────────────

export const CreatePermitSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  type: z.nativeEnum(PermitType),
  title: z.string().min(1).max(500),
  description: z.string().nullable().optional(),
  jurisdiction: z.string().nullable().optional(),
  agency: z.string().nullable().optional(),
  appliedDate: z.string().datetime().nullable().optional(),
  expirationDate: z.string().datetime().nullable().optional(),
  estimatedCost: z.number().positive().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdatePermitSchema = CreatePermitSchema.partial().extend({
  status: z.nativeEnum(PermitStatus).optional(),
  permitNumber: z.string().nullable().optional(),
  issuedDate: z.string().datetime().nullable().optional(),
  expirationDate: z.string().datetime().nullable().optional(),
  actualCost: z.number().positive().nullable().optional(),
});

// ─── DOCUMENT ────────────────────────────────────────────────────────────────────

export const CreateDocumentSchema = z.object({
  permitId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  category: z.nativeEnum(DocumentCategory),
  expirationDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const UpdateDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.nativeEnum(DocumentCategory).optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  expirationDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  extractedData: z.record(z.unknown()).optional(),
  aiClassification: z.string().optional(),
});

// ─── CHECKLIST ───────────────────────────────────────────────────────────────────

export const CreateChecklistItemSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  category: z.string().optional(),
  order: z.number().int().optional(),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().uuid().optional(),
  isConditional: z.boolean().optional(),
  condition: z.record(z.unknown()).optional(),
  parentItemId: z.string().uuid().optional(),
});

export const UpdateChecklistItemSchema = CreateChecklistItemSchema.partial().extend({
  status: z.nativeEnum(ChecklistItemStatus).optional(),
  completedAt: z.string().datetime().optional(),
});

// ─── INSPECTION ──────────────────────────────────────────────────────────────────

export const CreateInspectionSchema = z.object({
  type: z.string().min(1),
  scheduledDate: z.string().datetime(),
  inspectorName: z.string().optional(),
  inspectorPhone: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateInspectionSchema = CreateInspectionSchema.partial().extend({
  status: z.nativeEnum(InspectionStatus).optional(),
  completedDate: z.string().datetime().optional(),
  result: z.string().optional(),
});

// ─── FEE ─────────────────────────────────────────────────────────────────────────

export const CreateFeeSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string().datetime().optional(),
  category: z.string().optional(),
});

export const UpdateFeeSchema = CreateFeeSchema.partial().extend({
  status: z.nativeEnum(FeeStatus).optional(),
  paidDate: z.string().datetime().optional(),
  receiptUrl: z.string().url().optional(),
});

// ─── COMMENT ─────────────────────────────────────────────────────────────────────

export const CreateCommentSchema = z.object({
  content: z.string().min(1),
  parentCommentId: z.string().uuid().optional(),
});

// ─── DEADLINE ────────────────────────────────────────────────────────────────────

export const CreateDeadlineSchema = z.object({
  title: z.string().min(1).max(500),
  dueDate: z.string().datetime(),
  reminderDays: z.array(z.number().int().positive()).optional(),
});

// ─── TEAM / MEMBERS ──────────────────────────────────────────────────────────────

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
});

export const UpdateMemberSchema = z.object({
  role: z.nativeEnum(UserRole),
});

// ─── CONTACT ─────────────────────────────────────────────────────────────────────

export const CreateContactSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  notes: z.string().optional(),
});

// ─── PAGINATION / FILTERS ────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const PermitFilterSchema = PaginationSchema.extend({
  status: z.nativeEnum(PermitStatus).optional(),
  type: z.nativeEnum(PermitType).optional(),
  projectId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
});

// ─── INFERRED TYPES ──────────────────────────────────────────────────────────────

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type CreatePermitInput = z.infer<typeof CreatePermitSchema>;
export type UpdatePermitInput = z.infer<typeof UpdatePermitSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type CreateChecklistItemInput = z.infer<typeof CreateChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof UpdateChecklistItemSchema>;
export type CreateInspectionInput = z.infer<typeof CreateInspectionSchema>;
export type UpdateInspectionInput = z.infer<typeof UpdateInspectionSchema>;
export type CreateFeeInput = z.infer<typeof CreateFeeSchema>;
export type UpdateFeeInput = z.infer<typeof UpdateFeeSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type PermitFilterInput = z.infer<typeof PermitFilterSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type CreateDeadlineInput = z.infer<typeof CreateDeadlineSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type CreateContactInput = z.infer<typeof CreateContactSchema>;
