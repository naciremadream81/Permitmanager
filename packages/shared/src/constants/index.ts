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

// ─── STATUS CONFIG TYPE ───────────────────────────────────────────────────────────

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  description: string;
}

// ─── PERMIT STATUS ────────────────────────────────────────────────────────────────

export const PERMIT_STATUS_CONFIG: Record<PermitStatus, StatusConfig> = {
  [PermitStatus.DRAFT]: {
    label: 'Draft',
    color: '#6B7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: 'FileEdit',
    description: 'Permit application in progress',
  },
  [PermitStatus.PENDING_REVIEW]: {
    label: 'Pending Review',
    color: '#F59E0B',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    icon: 'Clock',
    description: 'Awaiting internal review',
  },
  [PermitStatus.SUBMITTED]: {
    label: 'Submitted',
    color: '#3B82F6',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: 'Send',
    description: 'Submitted to agency',
  },
  [PermitStatus.UNDER_REVIEW]: {
    label: 'Under Review',
    color: '#8B5CF6',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: 'Search',
    description: 'Agency is reviewing',
  },
  [PermitStatus.CORRECTIONS_NEEDED]: {
    label: 'Corrections Needed',
    color: '#EF4444',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: 'AlertCircle',
    description: 'Agency requested corrections',
  },
  [PermitStatus.APPROVED]: {
    label: 'Approved',
    color: '#10B981',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    icon: 'CheckCircle',
    description: 'Permit approved',
  },
  [PermitStatus.ISSUED]: {
    label: 'Issued',
    color: '#059669',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: 'Award',
    description: 'Permit issued and active',
  },
  [PermitStatus.ACTIVE]: {
    label: 'Active',
    color: '#0F2044',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    icon: 'Activity',
    description: 'Active permit',
  },
  [PermitStatus.EXPIRED]: {
    label: 'Expired',
    color: '#DC2626',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: 'XCircle',
    description: 'Permit has expired',
  },
  [PermitStatus.SUSPENDED]: {
    label: 'Suspended',
    color: '#D97706',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    icon: 'PauseCircle',
    description: 'Permit suspended',
  },
  [PermitStatus.REVOKED]: {
    label: 'Revoked',
    color: '#991B1B',
    bgColor: 'bg-red-100',
    textColor: 'text-red-900',
    icon: 'Ban',
    description: 'Permit revoked',
  },
  [PermitStatus.CLOSED]: {
    label: 'Closed',
    color: '#374151',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    icon: 'Archive',
    description: 'Permit closed',
  },
};

// ─── PERMIT TYPE ─────────────────────────────────────────────────────────────────

export const PERMIT_TYPE_CONFIG: Record<PermitType, { label: string; icon: string; category: string }> = {
  [PermitType.BUILDING]: { label: 'Building', icon: 'Building2', category: 'Construction' },
  [PermitType.ELECTRICAL]: { label: 'Electrical', icon: 'Zap', category: 'Trades' },
  [PermitType.PLUMBING]: { label: 'Plumbing', icon: 'Droplets', category: 'Trades' },
  [PermitType.MECHANICAL]: { label: 'Mechanical', icon: 'Settings', category: 'Trades' },
  [PermitType.DEMOLITION]: { label: 'Demolition', icon: 'Hammer', category: 'Construction' },
  [PermitType.GRADING]: { label: 'Grading', icon: 'Mountain', category: 'Site' },
  [PermitType.FIRE]: { label: 'Fire', icon: 'Flame', category: 'Safety' },
  [PermitType.SIGN]: { label: 'Sign', icon: 'PanelTop', category: 'Commercial' },
  [PermitType.ZONING]: { label: 'Zoning', icon: 'Map', category: 'Land Use' },
  [PermitType.ENCROACHMENT]: { label: 'Encroachment', icon: 'ArrowRightLeft', category: 'Land Use' },
  [PermitType.SPECIAL_USE]: { label: 'Special Use', icon: 'Star', category: 'Land Use' },
  [PermitType.CONDITIONAL_USE]: { label: 'Conditional Use', icon: 'ToggleLeft', category: 'Land Use' },
  [PermitType.VARIANCE]: { label: 'Variance', icon: 'GitBranch', category: 'Land Use' },
  [PermitType.SUBDIVISION]: { label: 'Subdivision', icon: 'LayoutGrid', category: 'Land Use' },
  [PermitType.ENVIRONMENTAL]: { label: 'Environmental', icon: 'Leaf', category: 'Compliance' },
  [PermitType.OCCUPANCY]: { label: 'Occupancy', icon: 'Home', category: 'Compliance' },
  [PermitType.HEALTH]: { label: 'Health', icon: 'Heart', category: 'Compliance' },
  [PermitType.LIQUOR]: { label: 'Liquor', icon: 'Wine', category: 'Commercial' },
  [PermitType.BUSINESS_LICENSE]: { label: 'Business License', icon: 'Briefcase', category: 'Commercial' },
  [PermitType.OTHER]: { label: 'Other', icon: 'FileQuestion', category: 'Other' },
};

// ─── DOCUMENT CATEGORY ───────────────────────────────────────────────────────────

export const DOCUMENT_CATEGORY_CONFIG: Record<DocumentCategory, { label: string; icon: string; color: string }> = {
  [DocumentCategory.APPLICATION]: { label: 'Application', icon: 'ClipboardList', color: 'text-blue-600' },
  [DocumentCategory.PLAN]: { label: 'Plan / Drawing', icon: 'Ruler', color: 'text-purple-600' },
  [DocumentCategory.ENGINEERING]: { label: 'Engineering', icon: 'Cpu', color: 'text-indigo-600' },
  [DocumentCategory.SURVEY]: { label: 'Survey', icon: 'Compass', color: 'text-cyan-600' },
  [DocumentCategory.ENVIRONMENTAL]: { label: 'Environmental', icon: 'Leaf', color: 'text-green-600' },
  [DocumentCategory.INSURANCE]: { label: 'Insurance', icon: 'Shield', color: 'text-amber-600' },
  [DocumentCategory.LICENSE]: { label: 'License', icon: 'Award', color: 'text-yellow-600' },
  [DocumentCategory.PERMIT_COPY]: { label: 'Permit Copy', icon: 'FileCheck', color: 'text-emerald-600' },
  [DocumentCategory.CORRESPONDENCE]: { label: 'Correspondence', icon: 'Mail', color: 'text-slate-600' },
  [DocumentCategory.INSPECTION_REPORT]: { label: 'Inspection Report', icon: 'ClipboardCheck', color: 'text-orange-600' },
  [DocumentCategory.PHOTO]: { label: 'Photo', icon: 'Camera', color: 'text-pink-600' },
  [DocumentCategory.RECEIPT]: { label: 'Receipt', icon: 'Receipt', color: 'text-teal-600' },
  [DocumentCategory.CONTRACT]: { label: 'Contract', icon: 'FileText', color: 'text-red-600' },
  [DocumentCategory.APPROVAL_LETTER]: { label: 'Approval Letter', icon: 'CheckSquare', color: 'text-green-700' },
  [DocumentCategory.NOTICE]: { label: 'Notice', icon: 'Bell', color: 'text-orange-500' },
  [DocumentCategory.OTHER]: { label: 'Other', icon: 'File', color: 'text-gray-500' },
};

// ─── DOCUMENT STATUS ─────────────────────────────────────────────────────────────

export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, StatusConfig> = {
  [DocumentStatus.PENDING]: {
    label: 'Pending', color: '#F59E0B', bgColor: 'bg-amber-100', textColor: 'text-amber-700',
    icon: 'Clock', description: 'Awaiting review',
  },
  [DocumentStatus.APPROVED]: {
    label: 'Approved', color: '#10B981', bgColor: 'bg-green-100', textColor: 'text-green-700',
    icon: 'CheckCircle', description: 'Document approved',
  },
  [DocumentStatus.REJECTED]: {
    label: 'Rejected', color: '#EF4444', bgColor: 'bg-red-100', textColor: 'text-red-700',
    icon: 'XCircle', description: 'Document rejected',
  },
  [DocumentStatus.EXPIRED]: {
    label: 'Expired', color: '#DC2626', bgColor: 'bg-red-100', textColor: 'text-red-800',
    icon: 'AlertCircle', description: 'Document expired',
  },
  [DocumentStatus.SUPERSEDED]: {
    label: 'Superseded', color: '#6B7280', bgColor: 'bg-gray-100', textColor: 'text-gray-600',
    icon: 'Archive', description: 'Replaced by newer version',
  },
};

// ─── CHECKLIST STATUS ────────────────────────────────────────────────────────────

export const CHECKLIST_STATUS_CONFIG: Record<ChecklistItemStatus, StatusConfig> = {
  [ChecklistItemStatus.NOT_STARTED]: {
    label: 'Not Started', color: '#6B7280', bgColor: 'bg-gray-100', textColor: 'text-gray-600',
    icon: 'Circle', description: '',
  },
  [ChecklistItemStatus.IN_PROGRESS]: {
    label: 'In Progress', color: '#3B82F6', bgColor: 'bg-blue-100', textColor: 'text-blue-700',
    icon: 'RefreshCw', description: '',
  },
  [ChecklistItemStatus.COMPLETED]: {
    label: 'Completed', color: '#10B981', bgColor: 'bg-green-100', textColor: 'text-green-700',
    icon: 'CheckCircle2', description: '',
  },
  [ChecklistItemStatus.BLOCKED]: {
    label: 'Blocked', color: '#EF4444', bgColor: 'bg-red-100', textColor: 'text-red-700',
    icon: 'XOctagon', description: '',
  },
  [ChecklistItemStatus.NOT_APPLICABLE]: {
    label: 'N/A', color: '#9CA3AF', bgColor: 'bg-gray-100', textColor: 'text-gray-500',
    icon: 'Minus', description: '',
  },
};

// ─── INSPECTION STATUS ───────────────────────────────────────────────────────────

export const INSPECTION_STATUS_CONFIG: Record<InspectionStatus, StatusConfig> = {
  [InspectionStatus.SCHEDULED]: {
    label: 'Scheduled', color: '#3B82F6', bgColor: 'bg-blue-100', textColor: 'text-blue-700',
    icon: 'CalendarCheck', description: '',
  },
  [InspectionStatus.PASSED]: {
    label: 'Passed', color: '#10B981', bgColor: 'bg-green-100', textColor: 'text-green-700',
    icon: 'CheckCircle', description: '',
  },
  [InspectionStatus.FAILED]: {
    label: 'Failed', color: '#EF4444', bgColor: 'bg-red-100', textColor: 'text-red-700',
    icon: 'XCircle', description: '',
  },
  [InspectionStatus.CANCELLED]: {
    label: 'Cancelled', color: '#6B7280', bgColor: 'bg-gray-100', textColor: 'text-gray-600',
    icon: 'XSquare', description: '',
  },
  [InspectionStatus.RESCHEDULED]: {
    label: 'Rescheduled', color: '#F59E0B', bgColor: 'bg-amber-100', textColor: 'text-amber-700',
    icon: 'RefreshCcw', description: '',
  },
};

// ─── FEE STATUS ──────────────────────────────────────────────────────────────────

export const FEE_STATUS_CONFIG: Record<FeeStatus, StatusConfig> = {
  [FeeStatus.PENDING]: {
    label: 'Pending', color: '#F59E0B', bgColor: 'bg-amber-100', textColor: 'text-amber-700',
    icon: 'Clock', description: '',
  },
  [FeeStatus.PAID]: {
    label: 'Paid', color: '#10B981', bgColor: 'bg-green-100', textColor: 'text-green-700',
    icon: 'CheckCircle', description: '',
  },
  [FeeStatus.OVERDUE]: {
    label: 'Overdue', color: '#EF4444', bgColor: 'bg-red-100', textColor: 'text-red-700',
    icon: 'AlertCircle', description: '',
  },
  [FeeStatus.WAIVED]: {
    label: 'Waived', color: '#6B7280', bgColor: 'bg-gray-100', textColor: 'text-gray-600',
    icon: 'Minus', description: '',
  },
  [FeeStatus.REFUNDED]: {
    label: 'Refunded', color: '#8B5CF6', bgColor: 'bg-purple-100', textColor: 'text-purple-700',
    icon: 'RotateCcw', description: '',
  },
};

// ─── USER ROLE ───────────────────────────────────────────────────────────────────

export const USER_ROLE_CONFIG: Record<UserRole, { label: string; description: string; icon: string }> = {
  [UserRole.OWNER]: { label: 'Owner', description: 'Full access + billing', icon: 'Crown' },
  [UserRole.ADMIN]: { label: 'Admin', description: 'Full access to all features', icon: 'ShieldCheck' },
  [UserRole.COORDINATOR]: { label: 'Coordinator', description: 'Manage permits and documents', icon: 'UserCheck' },
  [UserRole.VIEWER]: { label: 'Viewer', description: 'Read-only access', icon: 'Eye' },
};

// ─── STATUS TRANSITIONS (state machine) ──────────────────────────────────────────

export const PERMIT_STATUS_TRANSITIONS: Record<PermitStatus, PermitStatus[]> = {
  [PermitStatus.DRAFT]: [PermitStatus.PENDING_REVIEW],
  [PermitStatus.PENDING_REVIEW]: [PermitStatus.DRAFT, PermitStatus.SUBMITTED],
  [PermitStatus.SUBMITTED]: [PermitStatus.UNDER_REVIEW, PermitStatus.CORRECTIONS_NEEDED],
  [PermitStatus.UNDER_REVIEW]: [PermitStatus.CORRECTIONS_NEEDED, PermitStatus.APPROVED],
  [PermitStatus.CORRECTIONS_NEEDED]: [PermitStatus.SUBMITTED],
  [PermitStatus.APPROVED]: [PermitStatus.ISSUED, PermitStatus.REVOKED],
  [PermitStatus.ISSUED]: [PermitStatus.ACTIVE, PermitStatus.EXPIRED, PermitStatus.SUSPENDED, PermitStatus.REVOKED],
  [PermitStatus.ACTIVE]: [PermitStatus.EXPIRED, PermitStatus.SUSPENDED, PermitStatus.REVOKED, PermitStatus.CLOSED],
  [PermitStatus.EXPIRED]: [PermitStatus.CLOSED],
  [PermitStatus.SUSPENDED]: [PermitStatus.ACTIVE, PermitStatus.REVOKED],
  [PermitStatus.REVOKED]: [PermitStatus.CLOSED],
  [PermitStatus.CLOSED]: [],
};

// ─── APP CONSTANTS ───────────────────────────────────────────────────────────────

export const DEFAULT_REMINDER_DAYS = [7, 1];
export const DOCUMENT_EXPIRY_REMINDER_DAYS = [30, 14, 7];
export const RISK_SCORE_THRESHOLDS = { low: 30, medium: 60, high: 80 };
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];

export const SUBSCRIPTION_PLANS = {
  free: { name: 'Free', seats: 1, permits: 5, storage: 1 },
  pro: { name: 'Pro', seats: 10, permits: 100, storage: 50 },
  enterprise: { name: 'Enterprise', seats: -1, permits: -1, storage: 500 },
} as const;
