// PermitPro - Shared TypeScript Types
// All entity interfaces matching the Prisma schema

// ─── ENUMS ──────────────────────────────────────────────────────────────────────

export enum PermitStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CORRECTIONS_NEEDED = 'CORRECTIONS_NEEDED',
  APPROVED = 'APPROVED',
  ISSUED = 'ISSUED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
  CLOSED = 'CLOSED',
}

export enum PermitType {
  BUILDING = 'BUILDING',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  MECHANICAL = 'MECHANICAL',
  DEMOLITION = 'DEMOLITION',
  GRADING = 'GRADING',
  FIRE = 'FIRE',
  SIGN = 'SIGN',
  ZONING = 'ZONING',
  ENCROACHMENT = 'ENCROACHMENT',
  SPECIAL_USE = 'SPECIAL_USE',
  CONDITIONAL_USE = 'CONDITIONAL_USE',
  VARIANCE = 'VARIANCE',
  SUBDIVISION = 'SUBDIVISION',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  OCCUPANCY = 'OCCUPANCY',
  HEALTH = 'HEALTH',
  LIQUOR = 'LIQUOR',
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  OTHER = 'OTHER',
}

export enum DocumentCategory {
  APPLICATION = 'APPLICATION',
  PLAN = 'PLAN',
  ENGINEERING = 'ENGINEERING',
  SURVEY = 'SURVEY',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  INSURANCE = 'INSURANCE',
  LICENSE = 'LICENSE',
  PERMIT_COPY = 'PERMIT_COPY',
  CORRESPONDENCE = 'CORRESPONDENCE',
  INSPECTION_REPORT = 'INSPECTION_REPORT',
  PHOTO = 'PHOTO',
  RECEIPT = 'RECEIPT',
  CONTRACT = 'CONTRACT',
  APPROVAL_LETTER = 'APPROVAL_LETTER',
  NOTICE = 'NOTICE',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  SUPERSEDED = 'SUPERSEDED',
}

export enum ChecklistItemStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export enum InspectionStatus {
  SCHEDULED = 'SCHEDULED',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum FeeStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED',
  REFUNDED = 'REFUNDED',
}

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  COORDINATOR = 'COORDINATOR',
  VIEWER = 'VIEWER',
}

export enum NotificationType {
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  DOCUMENT_EXPIRING = 'DOCUMENT_EXPIRING',
  STATUS_CHANGED = 'STATUS_CHANGED',
  INSPECTION_REMINDER = 'INSPECTION_REMINDER',
  CORRECTION_NEEDED = 'CORRECTION_NEEDED',
  TEAM_INVITE = 'TEAM_INVITE',
  WEEKLY_DIGEST = 'WEEKLY_DIGEST',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ─── BASE ENTITY ────────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ─── ORGANIZATION ───────────────────────────────────────────────────────────────

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  logo: string | null;
  subscriptionTier: string;
  stripeCustomerId: string | null;
  settings: Record<string, unknown>;
}

export interface OrganizationWithRelations extends Organization {
  memberships: OrgMembership[];
  projects: Project[];
  permits: Permit[];
}

// ─── USER ───────────────────────────────────────────────────────────────────────

export interface User extends BaseEntity {
  email: string;
  name: string;
  avatar: string | null;
  phone: string | null;
}

export interface UserWithMemberships extends User {
  memberships: OrgMembershipWithOrg[];
}

// ─── ORG MEMBERSHIP ─────────────────────────────────────────────────────────────

export interface OrgMembership extends BaseEntity {
  userId: string;
  orgId: string;
  role: UserRole;
  invitedAt: Date | string;
  joinedAt: Date | string | null;
}

export interface OrgMembershipWithOrg extends OrgMembership {
  organization: Organization;
}

export interface OrgMembershipWithUser extends OrgMembership {
  user: User;
}

// ─── PROJECT ────────────────────────────────────────────────────────────────────

export interface Project extends BaseEntity {
  orgId: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  startDate: Date | string | null;
  estimatedEndDate: Date | string | null;
  status: string;
}

export interface ProjectWithPermits extends Project {
  permits: Permit[];
}

// ─── PERMIT ─────────────────────────────────────────────────────────────────────

export interface Permit extends BaseEntity {
  orgId: string;
  projectId: string | null;
  permitNumber: string | null;
  type: PermitType;
  status: PermitStatus;
  title: string;
  description: string | null;
  jurisdiction: string | null;
  agency: string | null;
  appliedDate: Date | string | null;
  issuedDate: Date | string | null;
  expirationDate: Date | string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  assigneeId: string | null;
  riskScore: number | null;
  completionPercentage: number;
  metadata: Record<string, unknown>;
}

export interface PermitWithRelations extends Permit {
  project: Project | null;
  assignee: User | null;
  documents: Document[];
  checklistItems: ChecklistItem[];
  inspections: Inspection[];
  fees: Fee[];
  comments: Comment[];
  deadlines: Deadline[];
  permitTags: PermitTagWithTag[];
}

export interface PermitListItem extends Permit {
  assignee: Pick<User, 'id' | 'name' | 'avatar'> | null;
  project: Pick<Project, 'id' | 'name'> | null;
  _count: {
    documents: number;
    checklistItems: number;
    inspections: number;
    comments: number;
  };
}

// ─── DOCUMENT ───────────────────────────────────────────────────────────────────

export interface Document extends BaseEntity {
  orgId: string;
  permitId: string | null;
  name: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  status: DocumentStatus;
  version: number;
  uploadedById: string;
  expirationDate: Date | string | null;
  extractedData: Record<string, unknown> | null;
  aiClassification: string | null;
  notes: string | null;
}

export interface DocumentWithUploader extends Document {
  uploadedBy: Pick<User, 'id' | 'name' | 'avatar'>;
}

// ─── CHECKLIST TEMPLATE ─────────────────────────────────────────────────────────

export interface ChecklistTemplateItem {
  title: string;
  description?: string;
  category?: string;
  isConditional?: boolean;
  condition?: Record<string, unknown>;
  children?: ChecklistTemplateItem[];
}

export interface ChecklistTemplate extends BaseEntity {
  orgId: string;
  name: string;
  permitType: PermitType;
  jurisdiction: string | null;
  items: ChecklistTemplateItem[];
}

// ─── CHECKLIST ITEM ─────────────────────────────────────────────────────────────

export interface ChecklistItem extends BaseEntity {
  permitId: string;
  title: string;
  description: string | null;
  status: ChecklistItemStatus;
  category: string | null;
  order: number;
  dueDate: Date | string | null;
  assigneeId: string | null;
  completedAt: Date | string | null;
  completedById: string | null;
  isConditional: boolean;
  condition: Record<string, unknown> | null;
  parentItemId: string | null;
}

export interface ChecklistItemWithAssignee extends ChecklistItem {
  assignee: Pick<User, 'id' | 'name' | 'avatar'> | null;
  completedBy: Pick<User, 'id' | 'name'> | null;
  children: ChecklistItem[];
}

// ─── INSPECTION ─────────────────────────────────────────────────────────────────

export interface Inspection extends BaseEntity {
  permitId: string;
  type: string;
  status: InspectionStatus;
  scheduledDate: Date | string;
  completedDate: Date | string | null;
  inspectorName: string | null;
  inspectorPhone: string | null;
  location: string | null;
  notes: string | null;
  result: string | null;
}

// ─── FEE ────────────────────────────────────────────────────────────────────────

export interface Fee extends BaseEntity {
  permitId: string;
  description: string;
  amount: number;
  status: FeeStatus;
  dueDate: Date | string | null;
  paidDate: Date | string | null;
  receiptUrl: string | null;
  category: string | null;
}

// ─── COMMENT ────────────────────────────────────────────────────────────────────

export interface Comment extends BaseEntity {
  permitId: string;
  userId: string;
  content: string;
  attachments: CommentAttachment[];
  parentCommentId: string | null;
}

export interface CommentAttachment {
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface CommentWithUser extends Comment {
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  replies: CommentWithUser[];
}

// ─── ACTIVITY ───────────────────────────────────────────────────────────────────

export interface Activity extends BaseEntity {
  orgId: string;
  permitId: string | null;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
}

export interface ActivityWithUser extends Activity {
  user: Pick<User, 'id' | 'name' | 'avatar'> | null;
}

// ─── NOTIFICATION ───────────────────────────────────────────────────────────────

export interface Notification extends BaseEntity {
  userId: string;
  orgId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  readAt: Date | string | null;
  sentAt: Date | string;
}

// ─── PUSH TOKEN ─────────────────────────────────────────────────────────────────

export interface PushToken extends BaseEntity {
  userId: string;
  token: string;
  platform: string;
  deviceName: string | null;
}

// ─── DEADLINE ───────────────────────────────────────────────────────────────────

export interface Deadline extends BaseEntity {
  permitId: string;
  title: string;
  dueDate: Date | string;
  reminderDays: number[];
  status: string;
  notifiedAt: Date | string | null;
}

export interface DeadlineWithPermit extends Deadline {
  permit: Pick<Permit, 'id' | 'title' | 'permitNumber' | 'type' | 'status'>;
}

// ─── CONTACT ────────────────────────────────────────────────────────────────────

export interface Contact extends BaseEntity {
  orgId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  notes: string | null;
}

// ─── AI CONVERSATION ────────────────────────────────────────────────────────────

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AiConversation extends BaseEntity {
  permitId: string | null;
  userId: string;
  messages: AiMessage[];
  summary: string | null;
}

// ─── SUBSCRIPTION ───────────────────────────────────────────────────────────────

export interface Subscription extends BaseEntity {
  orgId: string;
  stripeSubscriptionId: string | null;
  plan: string;
  status: string;
  currentPeriodEnd: Date | string | null;
  seats: number;
}

// ─── WEBHOOK ────────────────────────────────────────────────────────────────────

export interface Webhook extends BaseEntity {
  orgId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

// ─── TAG ────────────────────────────────────────────────────────────────────────

export interface Tag extends BaseEntity {
  orgId: string;
  name: string;
  color: string;
}

export interface PermitTag {
  id: string;
  permitId: string;
  tagId: string;
  createdAt: Date | string;
}

export interface PermitTagWithTag extends PermitTag {
  tag: Tag;
}

// ─── UTILITY TYPES ──────────────────────────────────────────────────────────────

export type CreateInput<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInput<T extends BaseEntity> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface DashboardStats {
  totalPermits: number;
  activePermits: number;
  expiringThisMonth: number;
  overdueItems: number;
  completionAverage: number;
  riskAverage: number;
  recentActivity: ActivityWithUser[];
  upcomingDeadlines: DeadlineWithPermit[];
  permitsByStatus: Record<PermitStatus, number>;
  permitsByType: Record<PermitType, number>;
}
