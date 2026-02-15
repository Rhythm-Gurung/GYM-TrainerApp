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
