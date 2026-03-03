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

// Trainer Session (trainer-side view of a booking — shows client info)
export interface TrainerSession {
    id: string;
    clientName: string;
    clientId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'confirmed' | 'completed' | 'pending' | 'cancelled';
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

// Schedule / Availability types
// ScheduleTimeSlot extends the registration TimeSlot with a UI-local `id`
export interface ScheduleTimeSlot {
    id: string;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
}

export interface DaySchedule {
    dayOfWeek: number; // 0 = Sunday … 6 = Saturday
    enabled: boolean;
    slots: ScheduleTimeSlot[];
}

// Trainer Profile
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
