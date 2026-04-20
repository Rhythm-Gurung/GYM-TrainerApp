// Trainer Registration Types
export interface TrainerRegisterInput {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  bio: string;
  expertiseCategories: string[];
  yearsOfExperience: number;
  contactNo: string;
  pricingPerSession: number;
  sessionType: 'online' | 'offline' | 'both';
  certifications?: FileUpload[];
  idProof?: FileUpload;
  profileImage?: FileUpload;
  availabilityPreference?: AvailabilityPreference;
}

export interface FileUpload {
  uri: string;
  name: string;
  type: string;
}

export interface AvailabilityPreference {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface TrainerRegisterResponse {
  detail: string;
  status: boolean;
}

// Expertise Categories (can be extended)
export const EXPERTISE_CATEGORIES = [
  'Weight Training',
  'Cardio',
  'Yoga',
  'Pilates',
  'CrossFit',
  'HIIT',
  'Functional Training',
  'Sports-Specific Training',
  'Rehabilitation',
  'Nutrition Coaching',
] as const;

export type ExpertiseCategory = (typeof EXPERTISE_CATEGORIES)[number];

export type TrainerSessionStatus =
    | 'pending'
    | 'accepted'
    | 'confirmed'
    | 'in_progress'
    | 'cancelled'
    | 'refund_pending'
    | 'refunded'
    | 'completed'
    | 'disputed'
    | 'no_show_client'
    | 'session_was_taken_but_not_end_by_client'
    | 'missed';

// Trainer Session (trainer-side view of a booking — shows client info)
export interface TrainerSession {
    id: string;
    bookingId?: string;
    clientName: string;
    clientId: string;
    clientAvatar?: string;
    date: string;
    startTime: string;
    endTime: string;
    status: TrainerSessionStatus;
    totalAmount: number;
}

// Earnings transaction (trainer-side)
export interface Transaction {
    id: string;
    description: string;
    amount: number; // positive for credit, negative for debit
    type: 'credit' | 'debit';
    date: string; // ISO date string YYYY-MM-DD
}

// Trainer earnings API types — GET /api/payment/trainer/earnings/
export interface TrainerEarningsSummary {
    total_earned_rs: number;
    pending_transfer_rs: number;
    on_hold_rs: number;
    total_bookings_paid: number;
}

export type TrainerPayoutStatus = 'transferred' | 'pending' | 'on_hold' | 'failed';

export interface TrainerPayout {
    payout_id: number;
    booking_id: number;
    client_name: string;
    booking_date: string; // YYYY-MM-DD
    payout_type: string;
    payout_type_label: string;
    amount_rs: number;
    status: TrainerPayoutStatus;
    status_label: string;
    transfer_reference: string | null;
    transferred_at: string | null; // ISO datetime
}

export interface TrainerEarningsResponse {
    summary: TrainerEarningsSummary;
    payouts: TrainerPayout[];
}

// Schedule / Availability types
// ScheduleTimeSlot extends the registration TimeSlot with a UI-local `id`
export interface ScheduleTimeSlot {
    id: string;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
}

export type SessionMode = 'online' | 'offline' | 'both';

export interface DaySchedule {
    dayOfWeek: number; // 0 = Sunday … 6 = Saturday
    enabled: boolean;
    slots: ScheduleTimeSlot[];
    session_mode?: SessionMode;
}

// Trainer Profile (local computed/display shape)
export interface TrainerProfile {
    id: string;
    fullName: string;
    email: string;
    profileImage?: string;
    rating: number;
    reviews: number;
    yearsOfExperience: number;
    isVerified: boolean;
    profileCompletion: number;
}

// API response types for trainer documents
export interface IdProofResponse {
    id: number;
    image: string;
    uploaded_at?: string;
}

export interface CertificationListItem {
    id: number;
    name: string;
    content_type: string;
    created_at: string;
    image_url: string;
}

export interface CertificationDetail {
    id: number;
    image: string;
    title?: string;
    uploaded_at?: string;
}

export interface GalleryItem {
    id: number;
    image_url: string;
    caption?: string;
    collection_id?: string | null;
    content_type?: string;
    created_at: string;
}

// Edit Profile form fields
export interface EditProfileForm {
    username: string;
    first_name: string;
    last_name: string;
    dob: string;
    contact_no: string;
    bio: string;
    location: string;
    years_of_experience: string;
    pricing_per_session: string;
}
