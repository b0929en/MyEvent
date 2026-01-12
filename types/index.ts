/**
 * Type definitions for MyEvent @ USM
 * These define the data contracts between frontend and backend
 */

import React from 'react';

// ============================================================================
// Database Row Types (Supabase)
// ============================================================================

export interface DBUser {
  user_id: string;
  user_email: string;
  user_password: string | null;
  user_name: string;
  created_at: string;
  last_login: string | null;
  user_role: string; // 'student' | 'organization_admin' | 'admin';
  students?: {
    matric_num: string;
    faculty?: string;
  } | null;
  organization_admins?: {
    org_id: string;
    user_position: string | null;
    organizations?: {
      org_name: string;
    } | null;
  } | null;
}

export interface DBOrganization {
  org_id: string;
  org_name: string;
  org_description: string | null;
  org_contact_email: string | null;
  org_social_link: string | null;
  org_logo: string | null;
}

export interface DBEventRequest {
  event_request_id: string;
  event_request_file: string | null;
  org_id: string | null;
  user_id: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'completed' | 'cancelled';
  submitted_at: string;
  admin_notes?: string | null;
  organizations?: DBOrganization;
  events?: DBEvent | DBEvent[];
  committee_members?: any;
}

export interface DBMyCSDRequest {
  mr_id: string;
  user_id: string | null;
  event_id: string | null;
  lk_document: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  submitted_at?: string;
  event_mycsd?: DBEventMyCSD[];
}

export interface DBMyCSDRecord {
  record_id: string;
  mycsd_score: number | null;
  mycsd_type: 'event' | 'organization';
  event_mycsd?: DBEventMyCSD[];
}

export interface DBEventMyCSD {
  record_id: string;
  mycsd_category: string | null;
  event_level: string | null;
  mr_id: string | null;
  mycsd_records?: DBMyCSDRecord;
}

export interface DBEvent {
  event_id: string;
  event_name: string;
  event_date: string;
  event_description: string | null;
  event_venue: string | null;
  event_request_id: string | null;
  start_time: string | null;
  end_time: string | null;
  end_date: string | null;
  capacity: number;
  banner_image: string | null;
  category: string | null;
  registered_count: number;
  objectives: string[] | null;
  links: unknown | null;
  has_mycsd: boolean;
  mycsd_category: string | null;
  mycsd_level: string | null;
  mycsd_points: number | null;
  agenda: string[] | null;
  is_mycsd_claimed: boolean;
  participation_fee: number;
  payment_qr_code: string | null;
  bank_account_info: string | null;
  registration_deadline: string | null;
  gallery: string[] | null;
  committee_members?: any;
  event_requests?: DBEventRequest | DBEventRequest[];
  mycsd_requests?: DBMyCSDRequest[];
}

export interface DBRegistration {
  event_id: string;
  user_id: string;
  attendance: 'present' | 'absent' | 'excused' | null;
  event_status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'completed' | 'cancelled' | null;
  registration_date: string;
  users?: {
    user_id: string;
    user_name: string;
    user_email: string;
    students?: {
      matric_num: string;
      faculty?: string;
    } | null;
  };
  events?: {
    event_id: string;
    event_name: string;
  };
}

export interface DBNotification {
  notification_id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface DBMyCSDLog {
  matric_no: string;
  record_id: string;
  score: number | null;
  position: MyCSDPosition | null;
  mycsd_records?: DBMyCSDRecord;
  students?: {
    matric_num: string;
    user_id: string;
  };
}

export interface DBMyCSDRequestWithDetails extends DBMyCSDRequest {
  events?: {
    event_id: string;
    event_name: string;
    event_date: string;
    mycsd_level?: string | null;
    mycsd_category?: string | null;
    event_requests?: {
      organizations?: {
        org_name: string;
      };
    };
  };
  users?: {
    user_id: string;
    user_name: string;
    user_email: string;
    students?: {
      matric_num: string;
    };
  };
  registrations?: DBRegistration[];
  created_at?: string;
}

// ============================================================================
// User & Authentication Types
// ============================================================================

export type UserRole = 'student' | 'organizer' | 'admin';

export type User = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  matricNumber?: string; // For students
  organizationId?: string; // For organizers
  organizationName?: string; // For organizers
  phone?: string;
  faculty?: string;
  position?: string; // For organizers (e.g. President, Secretary)
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

// ============================================================================
// Organization Types
// ============================================================================

export type Organization = {
  id: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  facultyId?: string;
  logo?: string;
  gallery?: string[];
  organizationChart?: string;
  createdAt: string;
  updatedAt: string;
};

// ============================================================================
// Event Types
// ============================================================================

export type ProposalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'revision_needed' | 'published' | 'completed' | 'cancelled';
export type EventStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published' | 'completed' | 'cancelled';
export type EventCategory = 'sport' | 'academic' | 'cultural' | 'social' | 'competition' | 'talk' | 'workshop' | 'other';
export type MyCSDCategory =
  | 'Debat dan Pidato'
  | 'Khidmat Masyarakat'
  | 'Kebudayaan'
  | 'Kepimpinan'
  | 'Keusahawanan'
  | 'Reka Cipta dan Inovasi'
  | 'Sukan/Rekreasi/Sosialisasi'
  | 'Persatuan/Kelab';

export type MyCSDLevel =
  | 'P.Pengajian / Desasiswa / Persatuan / Kelab'
  | 'Negeri / Universiti'
  | 'Kebangsaan / Antara University'
  | 'Antarabangsa';

export type MyCSDRole =
  | 'pengikut'
  | 'peserta'
  | 'ajk_kecil'
  | 'ajk_tertinggi'
  | 'pengarah';

export type MyCSDPosition =
  | 'Pengikut'
  | 'Peserta'
  | 'AJK Kecil'
  | 'AJK Tertinggi'
  | 'Pengarah';

export type EventProposal = {
  id: string;
  organizerId: string;
  organizerName: string;
  eventTitle: string;
  eventDescription: string;
  category: EventCategory;
  estimatedParticipants: number;
  proposedDate: string;
  proposedVenue: string;
  documents: {
    kertasKerja: string;
    borangProgram: string;
    borangMyCSD?: string;
    supportingDocuments?: string;
  };
  status: ProposalStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
  updatedAt: string;
  committeeMembers?: CommitteeMember[];
};

export type Event = {
  id: string;
  proposalId?: string; // Link to approved proposal
  organizerId: string;
  organizerName: string;
  title: string;
  description: string;
  category: EventCategory;
  bannerImage?: string;
  gallery?: string[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  capacity: number;
  registeredCount: number;
  participationFee: number;
  paymentQrCode?: string;
  bankAccountInfo?: string;
  hasMyCSD: boolean;
  mycsdCategory?: MyCSDCategory;
  mycsdLevel?: MyCSDLevel;
  mycsdPoints?: number;
  status: EventStatus;
  registrationDeadline: string;
  links?: EventLink[];
  objectives?: string[];
  agenda?: string[];
  is_mycsd_claimed?: boolean;
  mycsdStatus?: 'pending' | 'approved' | 'rejected' | 'none';
  mycsdRejectionReason?: string;
  adminNotes?: string;
  committeeMembers?: CommitteeMember[];
  createdAt: string;
  updatedAt: string;
};

export type EventLink = {
  title: string;
  url: string;
};

export type EventApplication = {
  id: string;
  eventId: string;
  organizerId: string;
  eventDetails: Partial<Event>;
  proposalDocument?: string;
  budgetDocument?: string;
  committeeList?: CommitteeMember[];
  expectedParticipants: number;
  status: 'pending' | 'approved' | 'rejected';
  adminFeedback?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
};

export type CommitteeMember = {
  name: string;
  matricNumber: string;
  position: string;
  email?: string;
  phone?: string;
  faculty?: string;
};

// ============================================================================
// Registration Types
// ============================================================================

export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'attended' | 'absent';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export type Registration = {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  matricNumber?: string;
  faculty?: string;
  status: RegistrationStatus;
  paymentStatus?: PaymentStatus;
  paymentAmount?: number;
  attendanceMarkedAt?: string;
  checkInTime?: string;
  qrCode?: string;
  registeredAt: string;
  updatedAt: string;
};

// ============================================================================
// MyCSD Types
// ============================================================================

export type MyCSDStatus = 'pending' | 'approved' | 'rejected';
export type ParticipantRole = 'participant' | 'committee' | 'organizer';

export type MyCSDRecord = {
  id: string;
  userId: string;
  eventId: string;
  eventName: string;
  organizationName: string;
  category: MyCSDCategory;
  level: MyCSDLevel;
  role: ParticipantRole;
  points: number | string;
  eventDate: string;
  semester: string;
  status: 'approved' | 'pending_approval' | 'rejected' | 'waiting_for_report' | 'cancelled' | 'not_applicable';
  rejectionReason?: string;
  proofDocument?: string;
  remarks?: string;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  position?: MyCSDPosition;
};

export type MyCSDSummary = {
  totalPoints: number;
  totalEvents: number;
  pointsByCategory: Record<MyCSDCategory, number>;
  pointsByLevel: Record<MyCSDLevel, number>;
  eventsThisMonth: number;
  pointsThisMonth: number;
};

export type ClubPosition = {
  id: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  position: string;
  semesterRegistered: string;
  points: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed';
};

// ============================================================================
// Post-Event Report Types
// ============================================================================

export type PostEventReport = {
  id: string;
  eventId: string;
  organizerId: string;
  summary: string;
  achievements: string[];
  actualParticipants: number;
  committeePerformance: string;
  supportingDocuments?: string[];
  photos?: string[];
  participantList: string[];
  committeeList: string[];
  mycsdRecommendations: MyCSDRecommendation[];
  status: 'pending' | 'approved' | 'rejected';
  adminFeedback?: string;
  submittedAt: string;
  reviewedAt?: string;
};

export type MyCSDRecommendation = {
  userId: string;
  userName: string;
  role: ParticipantRole;
  recommendedPoints: number;
};

// ============================================================================
// Attendance Types
// ============================================================================

export type AttendanceRecord = {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  matricNumber?: string;
  markedAt: string;
  markedBy: string;
  method: 'qr' | 'manual';
};

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType =
  | 'registration_confirmed'
  | 'event_reminder'
  | 'event_cancelled'
  | 'application_approved'
  | 'application_rejected'
  | 'mycsd_approved'
  | 'mycsd_rejected';

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  relatedId?: string; // eventId, registrationId, etc.
  createdAt: string;
};

// ============================================================================
// Filter & Search Types
// ============================================================================

export type EventFilters = {
  search?: string;
  category?: EventCategory[];
  hasMyCSD?: boolean;
  mycsdCategory?: MyCSDCategory[];
  mycsdLevel?: MyCSDLevel[];
  startDate?: string;
  endDate?: string;
  organizerId?: string;
  status?: EventStatus[];
};

export type MyCSDFilters = {
  search?: string;
  category?: MyCSDCategory[];
  level?: MyCSDLevel[];
  role?: ParticipantRole[];
  status?: MyCSDStatus[];
  semester?: string[];
};

// ============================================================================
// Pagination Types
// ============================================================================

export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ============================================================================
// Form Input Types
// ============================================================================

export type LoginFormData = {
  email: string;
  password: string;
};

export type EventFormData = Omit<Event, 'id' | 'organizerId' | 'organizerName' | 'registeredCount' | 'createdAt' | 'updatedAt'>;

export type RegistrationFormData = {
  eventId: string;
  userId: string;
  paymentProof?: File;
};

export type MyCSDFormData = {
  eventName: string;
  organizationName: string;
  category: MyCSDCategory;
  level: MyCSDLevel;
  role: ParticipantRole;
  points: number;
  semester: string;
  proofDocument?: File;
  remarks?: string;
};

// ============================================================================
// Update/Input Types for Services
// ============================================================================

export type ProposalCreateInput = {
  organizerId: string;
  eventTitle: string;
  eventDescription: string;
  category: EventCategory;
  estimatedParticipants: number;
  proposedDate: string; // Used as Start Date
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  participationFee: number;
  proposedVenue: string;
  documents: Record<string, string> | {
    kertasKerja: string;
    borangProgram: string;
    borangMyCSD?: string;
    supportingDocuments?: string;
  };
  committeeMembers?: CommitteeMember[];
};

export type ProposalUpdateInput = Partial<Omit<ProposalCreateInput, 'documents'>> & {
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'completed' | 'cancelled';
  adminNotes?: string;
  documents?: DocumentsInput | Record<string, string>;
  committeeMembers?: CommitteeMember[];
};

export type EventUpdateInput = Partial<{
  title: string;
  description: string;
  category: EventCategory;
  bannerImage: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  capacity: number;
  status: EventStatus;
  hasMyCSD: boolean;
  mycsdCategory: MyCSDCategory;
  mycsdLevel: MyCSDLevel;
  mycsdPoints: number;
  objectives: string[];
  links: EventLink[];
  agenda: string[];
  // Database field names for compatibility
  event_name: string;
  event_description: string;
  event_date: string;
  event_venue: string;
  start_time: string;
  end_time: string;
  end_date: string;
  banner_image: string;
  has_mycsd: boolean;
  mycsd_category: string;
  mycsd_level: string;
  mycsd_points: number;
  participation_fee: number;
  payment_qr_code: string;
  bank_account_info: string;
  registration_deadline: string;
  gallery: string[];
}>;

export type DocumentsInput = {
  kertasKerja?: string | null;
  borangProgram?: string | null;
  borangMyCSD?: string | null;
  supportingDocuments?: string | null;
};

// ============================================================================
// Additional Component Types
// ============================================================================

export type ActivityItem = {
  id: string;
  type: 'proposal' | 'mycsd' | 'notification' | 'proposal_submitted' | 'event_approved';
  title: string;
  user?: string;
  status?: string;
  time: string;
  displayTime: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  timestamp?: string;
};

export type MyCSDRequest = {
  id: string;
  eventId: string;
  eventName: string;
  eventDate?: string;
  userId: string;
  userName: string;
  matricNumber?: string;
  category?: MyCSDCategory;
  level?: MyCSDLevel;
  points?: number;
  status: MyCSDStatus;
  document?: string;
  submittedCount?: number;
  approvedCount?: number;
};

export type ApiError = {
  message: string;
  code?: string;
  details?: unknown;
};
