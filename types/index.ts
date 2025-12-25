/**
 * Type definitions for MyEvent @ USM
 * These define the data contracts between frontend and backend
 */

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
  phone?: string;
  faculty?: string;
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

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'revision_needed';
export type EventStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published' | 'completed' | 'cancelled';
export type EventCategory = 'sport' | 'academic' | 'cultural' | 'social' | 'competition' | 'talk' | 'workshop' | 'other';
export type MyCSDCategory = 'teras' | 'baruna' | 'advance' | 'labels';
export type MyCSDLevel = 'antarabangsa' | 'negeri_universiti' | 'kampus';

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
    eventProposal: string; // PDF file path/URL
    budgetPlan: string;
    riskAssessment: string;
    supportingDocuments: string;
  };
  status: ProposalStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
  updatedAt: string;
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
  hasMyCSD: boolean;
  mycsdCategory?: MyCSDCategory;
  mycsdLevel?: MyCSDLevel;
  mycsdPoints?: number;
  status: EventStatus;
  registrationDeadline: string;
  links?: EventLink[];
  objectives?: string[];
  agenda?: string[];
  adminNotes?: string;
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
  email: string;
  phone: string;
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
  points: number;
  semester: string;
  status: MyCSDStatus;
  proofDocument?: string;
  remarks?: string;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
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
